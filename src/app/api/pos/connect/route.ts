import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { posIntegrations } from "@/lib/db/schema"
import { getPOSProvider } from "@/lib/pos"
import type { POSProviderKey } from "@/lib/pos/types"
import { eq } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenantId, propertyId, leaseId, provider, storeId, locationId, apiKey, syncFrequency } = body

    if (!tenantId || !propertyId || !leaseId || !provider || !storeId || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: tenantId, propertyId, leaseId, provider, storeId, apiKey" },
        { status: 400 }
      )
    }

    // Test the connection first
    const posProvider = getPOSProvider(provider as POSProviderKey)
    const testResult = await posProvider.testConnection({
      provider: provider as POSProviderKey,
      storeId,
      locationId,
      apiKey,
      syncFrequency: syncFrequency || "daily",
    })

    if (!testResult.success) {
      return NextResponse.json(
        { success: false, error: testResult.message },
        { status: 400 }
      )
    }

    // Check if there's already a POS integration for this lease
    const existing = await db
      .select()
      .from(posIntegrations)
      .where(eq(posIntegrations.leaseId, leaseId))
      .limit(1)

    let integration
    if (existing.length > 0) {
      // Update existing
      const [updated] = await db
        .update(posIntegrations)
        .set({
          provider,
          storeId,
          locationId,
          apiKeyEncrypted: apiKey, // In production: encrypt this
          syncFrequency: syncFrequency || "daily",
          status: "connected",
          lastSyncAt: new Date(),
          lastSyncStatus: "success",
          updatedAt: new Date(),
        })
        .where(eq(posIntegrations.id, existing[0].id))
        .returning()
      integration = updated
    } else {
      // Create new
      const [created] = await db
        .insert(posIntegrations)
        .values({
          tenantId,
          propertyId,
          leaseId,
          provider,
          storeId,
          locationId,
          apiKeyEncrypted: apiKey, // In production: encrypt this
          syncFrequency: syncFrequency || "daily",
          status: "connected",
          lastSyncAt: new Date(),
          lastSyncStatus: "success",
        })
        .returning()
      integration = created
    }

    return NextResponse.json({
      success: true,
      data: {
        integration,
        connectionTest: testResult,
      },
    })
  } catch (error) {
    console.error("Error connecting POS:", error)
    return NextResponse.json(
      { success: false, error: "Failed to connect POS system" },
      { status: 500 }
    )
  }
}
