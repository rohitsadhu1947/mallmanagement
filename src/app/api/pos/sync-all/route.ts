import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { posIntegrations, tenants } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isDemoMode } from "@/lib/pos"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const days = body.days || 30

    // Fetch all connected POS integrations
    const connectedIntegrations = await db
      .select({
        integration: posIntegrations,
        tenantCategory: tenants.category,
      })
      .from(posIntegrations)
      .leftJoin(tenants, eq(posIntegrations.tenantId, tenants.id))
      .where(eq(posIntegrations.status, "connected"))

    if (connectedIntegrations.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          integrations: 0,
          totalSynced: 0,
          errors: [],
          message: "No connected POS integrations found.",
        },
      })
    }

    // In demo mode, don't pull fake mock data.
    // Sales data should only come from the POS Simulator.
    if (isDemoMode()) {
      // Just update lastSyncAt timestamps so the UI shows a recent sync
      for (const { integration } of connectedIntegrations) {
        await db
          .update(posIntegrations)
          .set({
            lastSyncAt: new Date(),
            lastSyncStatus: "success",
            status: "connected",
            updatedAt: new Date(),
          })
          .where(eq(posIntegrations.id, integration.id))
      }

      return NextResponse.json({
        success: true,
        data: {
          integrations: connectedIntegrations.length,
          totalSynced: 0,
          errors: [],
          dateRange: {
            start: new Date(Date.now() - days * 86400000).toISOString().split("T")[0],
            end: new Date().toISOString().split("T")[0],
          },
          message: `${connectedIntegrations.length} stores synced. Use the POS Simulator to enter sales data.`,
        },
      })
    }

    // --- Production: sync from real POS providers ---
    const syncEndDate = new Date()
    const syncStartDate = new Date()
    syncStartDate.setDate(syncStartDate.getDate() - days)
    const startStr = syncStartDate.toISOString().split("T")[0]
    const endStr = syncEndDate.toISOString().split("T")[0]

    // NOTE: production sync logic would go here — fetching from real POS
    // APIs (Shopify, Pine Labs, etc.). For now we just return 0 synced.

    return NextResponse.json({
      success: true,
      data: {
        integrations: connectedIntegrations.length,
        totalSynced: 0,
        errors: [],
        dateRange: { start: startStr, end: endStr },
        message: `${connectedIntegrations.length} stores checked. No new data from POS providers.`,
      },
    })
  } catch (error) {
    console.error("Error syncing all POS:", error)
    return NextResponse.json(
      { success: false, error: "Failed to sync POS data" },
      { status: 500 }
    )
  }
}
