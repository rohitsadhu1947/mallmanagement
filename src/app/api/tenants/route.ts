import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tenants, leases } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { getCachedOrFetch, CACHE_KEYS, CACHE_TTL, invalidateEntityCache } from "@/lib/cache"
import { PERMISSIONS, requirePermission } from "@/lib/auth/rbac"

export async function GET(request: NextRequest) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.TENANTS_VIEW)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const refresh = searchParams.get("refresh") === "true"

    // Invalidate cache if refresh requested
    if (refresh && propertyId) {
      await invalidateEntityCache("tenant", propertyId, propertyId)
    }

    // Use caching for tenant list
    const cacheKey = propertyId
      ? CACHE_KEYS.TENANT_LIST(propertyId)
      : `tenants:list:all:${status || "all"}:${category || "all"}`

    const result = await getCachedOrFetch(
      cacheKey,
      async () => {
        // Get tenants with their lease information
        const tenantsWithLeases = await db
          .select({
            tenant: tenants,
            activeLease: leases,
          })
          .from(tenants)
          .leftJoin(
            leases,
            and(
              eq(leases.tenantId, tenants.id),
              eq(leases.status, "active")
            )
          )
          .where(
            and(
              propertyId ? eq(tenants.propertyId, propertyId) : undefined,
              status ? eq(tenants.status, status) : undefined,
              category ? eq(tenants.category, category) : undefined
            )
          )
          .orderBy(desc(tenants.createdAt))

        // Deduplicate: a tenant with multiple active leases appears as multiple rows
        // Keep the first lease found for each tenant (most recent by join order)
        const seen = new Set<string>()
        const deduplicated: typeof tenantsWithLeases = []
        for (const row of tenantsWithLeases) {
          if (!seen.has(row.tenant.id)) {
            seen.add(row.tenant.id)
            deduplicated.push(row)
          }
        }

        // Transform the data
        return deduplicated.map(({ tenant, activeLease }) => ({
          ...tenant,
          lease: activeLease
            ? {
                id: activeLease.id,
                unitNumber: activeLease.unitNumber,
                floor: activeLease.floor,
                areaSqft: activeLease.areaSqft,
                baseRent: activeLease.baseRent,
                startDate: activeLease.startDate,
                endDate: activeLease.endDate,
                status: activeLease.status,
              }
            : null,
        }))
      },
      CACHE_TTL.MEDIUM // 5 minutes
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Get tenants error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.TENANTS_CREATE)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const body = await request.json()
    const {
      propertyId,
      businessName,
      legalEntityName,
      category,
      subcategory,
      contactPerson,
      email,
      phone,
      gstin,
    } = body

    if (!propertyId || !businessName) {
      return NextResponse.json(
        { error: "Property ID and business name are required" },
        { status: 400 }
      )
    }

    const tenantId = crypto.randomUUID()

    await db.insert(tenants).values({
      id: tenantId,
      propertyId,
      businessName,
      legalEntityName,
      category,
      subcategory,
      contactPerson,
      email,
      phone,
      gstin,
      status: "active",
    })

    const newTenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    })

    // Invalidate tenant list cache after creating new tenant
    await invalidateEntityCache("tenant", tenantId, propertyId)

    return NextResponse.json(newTenant, { status: 201 })
  } catch (error) {
    console.error("Create tenant error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

