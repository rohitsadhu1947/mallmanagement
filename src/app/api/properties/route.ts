import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { properties, dailyMetrics } from "@/lib/db/schema"
import { eq, desc, sql, and } from "drizzle-orm"
import { getCachedOrFetch, CACHE_KEYS, CACHE_TTL, invalidateEntityCache } from "@/lib/cache"
import { PERMISSIONS, requirePermission } from "@/lib/auth/rbac"

export async function GET(request: NextRequest) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.PROPERTIES_VIEW)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId")
    const refresh = searchParams.get("refresh") === "true"

    // Invalidate cache if refresh requested - invalidate all property caches
    if (refresh) {
      await invalidateEntityCache("property", "all", organizationId || "all")
      // Also delete the specific cache key directly
      const { deleteCache } = await import("@/lib/cache")
      await deleteCache(CACHE_KEYS.PROPERTY_LIST(organizationId || "all"))
    }

    // Use caching for property list
    const propertiesWithMetrics = await getCachedOrFetch(
      CACHE_KEYS.PROPERTY_LIST(organizationId || "all"),
      async () => {
        // Get all properties first
        const propertiesData = await db
          .select()
          .from(properties)
          .where(organizationId ? eq(properties.organizationId, organizationId) : undefined)
          .orderBy(desc(properties.createdAt))

        // Import tenants and leases for counting
        const { tenants, leases } = await import("@/lib/db/schema")

        // Get counts and metrics for each property
        const result = await Promise.all(
          propertiesData.map(async (property) => {
            // Count tenants for this property
            const [tenantResult] = await db
              .select({ count: sql<number>`count(*)::integer` })
              .from(tenants)
              .where(eq(tenants.propertyId, property.id))
            
            // Count active leases for this property
            const [leaseResult] = await db
              .select({ count: sql<number>`count(*)::integer` })
              .from(leases)
              .where(
                and(
                  eq(leases.propertyId, property.id),
                  eq(leases.status, "active")
                )
              )

            // Get latest metrics
            const latestMetric = await db.query.dailyMetrics.findFirst({
              where: eq(dailyMetrics.propertyId, property.id),
              orderBy: desc(dailyMetrics.metricDate),
            })

            return {
              ...property,
              tenantCount: Number(tenantResult?.count) || 0,
              activeLeases: Number(leaseResult?.count) || 0,
              metrics: latestMetric
                ? {
                    occupancyRate: latestMetric.occupancyRate,
                    collectionRate: latestMetric.collectionRate,
                    revenue: latestMetric.revenue,
                    footTraffic: latestMetric.footTraffic,
                  }
                : null,
            }
          })
        )
        return result
      },
      CACHE_TTL.MEDIUM // 5 minutes
    )

    return NextResponse.json({ 
      success: true, 
      data: propertiesWithMetrics 
    })
  } catch (error) {
    console.error("Error fetching properties:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch properties" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.PROPERTIES_CREATE)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      code, 
      address, 
      city, 
      state, 
      country,
      pincode,
      type, 
      status,
      totalArea, 
      leasableArea,
      floors,
      operatingHours,
      amenities,
      metadata,
      organizationId 
    } = body

    // Validation
    if (!name || !code || !city || !state) {
      return NextResponse.json(
        { success: false, error: "Name, code, city, and state are required" },
        { status: 400 }
      )
    }

    // Check for duplicate code
    const existingProperty = await db.query.properties.findFirst({
      where: eq(properties.code, code),
    })
    
    if (existingProperty) {
      return NextResponse.json(
        { success: false, error: "A property with this code already exists" },
        { status: 400 }
      )
    }

    // Validate organizationId is a valid UUID if provided
    const isValidUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(str)
    }
    
    // Only use organizationId if it's a valid UUID, otherwise null
    const validOrgId = organizationId && isValidUUID(organizationId) ? organizationId : null

    const [newProperty] = await db
      .insert(properties)
      .values({
        name,
        code,
        address: address || null,
        city,
        state,
        country: country || "India",
        pincode: pincode || null,
        type: type || "mall",
        status: status || "active",
        totalAreaSqft: totalArea || null,
        leasableAreaSqft: leasableArea || null,
        floors: floors || null,
        operatingHours: operatingHours || {},
        amenities: amenities || [],
        metadata: metadata || {},
        organizationId: validOrgId,
      })
      .returning()

    // Invalidate property list cache after creating new property
    // Always invalidate the "all" cache (used when no orgId filter is passed in GET)
    await invalidateEntityCache("property", newProperty.id, "all")
    if (validOrgId) {
      await invalidateEntityCache("property", newProperty.id, validOrgId)
    }

    return NextResponse.json({ success: true, data: newProperty }, { status: 201 })
  } catch (error) {
    console.error("Error creating property:", error)
    
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        { success: false, error: "A property with this code already exists" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to create property" },
      { status: 500 }
    )
  }
}

