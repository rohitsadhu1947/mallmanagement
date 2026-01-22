import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { properties, tenants, leases, dailyMetrics } from "@/lib/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { PERMISSIONS, requirePermission } from "@/lib/auth/rbac"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.PROPERTIES_VIEW)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const propertyId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(propertyId)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID format" },
        { status: 400 }
      )
    }

    // Fetch property with aggregated data
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
    })

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      )
    }

    // Get tenant count for this property
    const tenantCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenants)
      .where(eq(tenants.propertyId, propertyId))

    const tenantCount = Number(tenantCountResult[0]?.count || 0)

    // Get active leases count
    const activeLeasesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leases)
      .where(and(eq(leases.propertyId, propertyId), eq(leases.status, "active")))

    const activeLeases = Number(activeLeasesResult[0]?.count || 0)

    // Get latest metrics
    const latestMetric = await db.query.dailyMetrics.findFirst({
      where: eq(dailyMetrics.propertyId, propertyId),
      orderBy: desc(dailyMetrics.metricDate),
    })

    // Calculate occupancy rate (active tenants / total capacity estimate)
    // For now, we'll use a simple calculation based on leasable area
    const occupancyRate = latestMetric?.occupancyRate || 
      (property.leasableAreaSqft ? Math.min(95, (tenantCount * 1500 / Number(property.leasableAreaSqft)) * 100) : 0)

    // Format the response
    const propertyDetails = {
      ...property,
      totalAreaSqft: property.totalAreaSqft ? Number(property.totalAreaSqft) : 0,
      leasableAreaSqft: property.leasableAreaSqft ? Number(property.leasableAreaSqft) : 0,
      floors: property.floors || 1,
      tenantCount,
      activeLeases,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      collectionRate: latestMetric?.collectionRate ? Number(latestMetric.collectionRate) : 0,
      monthlyRevenue: latestMetric?.revenue ? Number(latestMetric.revenue) : 0,
      footTraffic: latestMetric?.footTraffic || 0,
      zones: Array.isArray(property.zones) ? property.zones : [],
    }

    return NextResponse.json({ success: true, data: propertyDetails })
  } catch (error) {
    console.error("Error fetching property:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch property" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.PROPERTIES_UPDATE)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const propertyId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(propertyId)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID format" },
        { status: 400 }
      )
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
      totalAreaSqft,
      leasableAreaSqft,
      floors,
      operatingHours,
      amenities,
      zones,
      metadata,
    } = body

    // Check if property exists
    const existingProperty = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
    })

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      )
    }

    // Check for duplicate code if code is being changed
    if (code && code !== existingProperty.code) {
      const duplicateCode = await db.query.properties.findFirst({
        where: eq(properties.code, code),
      })
      if (duplicateCode) {
        return NextResponse.json(
          { success: false, error: "A property with this code already exists" },
          { status: 400 }
        )
      }
    }

    // Update property
    const [updatedProperty] = await db
      .update(properties)
      .set({
        ...(name && { name }),
        ...(code && { code }),
        ...(address !== undefined && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(country && { country }),
        ...(pincode !== undefined && { pincode }),
        ...(type && { type }),
        ...(status && { status }),
        ...(totalAreaSqft !== undefined && { totalAreaSqft }),
        ...(leasableAreaSqft !== undefined && { leasableAreaSqft }),
        ...(floors !== undefined && { floors }),
        ...(operatingHours !== undefined && { operatingHours }),
        ...(amenities !== undefined && { amenities }),
        ...(zones !== undefined && { zones }),
        ...(metadata !== undefined && { metadata }),
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning()

    return NextResponse.json({ success: true, data: updatedProperty })
  } catch (error) {
    console.error("Error updating property:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update property" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.PROPERTIES_DELETE)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const propertyId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(propertyId)) {
      return NextResponse.json(
        { success: false, error: "Invalid property ID format" },
        { status: 400 }
      )
    }

    // Check if property exists
    const existingProperty = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
    })

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      )
    }

    // Check if property has tenants
    const tenantCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenants)
      .where(eq(tenants.propertyId, propertyId))

    if (Number(tenantCount[0]?.count || 0) > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete property with active tenants" },
        { status: 400 }
      )
    }

    // Delete property
    await db.delete(properties).where(eq(properties.id, propertyId))

    return NextResponse.json({ success: true, message: "Property deleted successfully" })
  } catch (error) {
    console.error("Error deleting property:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete property" },
      { status: 500 }
    )
  }
}
