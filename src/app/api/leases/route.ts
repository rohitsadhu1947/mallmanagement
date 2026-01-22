import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { leases, tenants, properties } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { PERMISSIONS, requirePermission } from "@/lib/auth/rbac"

export async function GET(request: NextRequest) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.LEASES_VIEW)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")
    const tenantId = searchParams.get("tenantId")
    const status = searchParams.get("status")

    // Build conditions
    const conditions = []
    if (propertyId) conditions.push(eq(leases.propertyId, propertyId))
    if (tenantId) conditions.push(eq(leases.tenantId, tenantId))
    if (status) conditions.push(eq(leases.status, status))

    const allLeases = await db
      .select({
        lease: leases,
        tenant: tenants,
        property: properties,
      })
      .from(leases)
      .leftJoin(tenants, eq(leases.tenantId, tenants.id))
      .leftJoin(properties, eq(leases.propertyId, properties.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leases.startDate))

    const result = allLeases.map(({ lease, tenant, property }) => ({
      ...lease,
      tenant: tenant ? {
        id: tenant.id,
        businessName: tenant.businessName,
        contactPerson: tenant.contactPerson,
      } : null,
      property: property ? {
        id: property.id,
        name: property.name,
        code: property.code,
      } : null,
    }))

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Get leases error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.LEASES_CREATE)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      tenantId,
      propertyId,
      unitNumber,
      floor,
      zone,
      areaSqft,
      leaseType = "fixed_rent",
      baseRent,
      revenueSharePercentage,
      camCharges,
      maintenanceCharges,
      securityDeposit,
      startDate,
      endDate,
      escalationRate,
      escalationFrequency,
      lockInPeriod,
      fitOutPeriod,
      rentFreePeriod,
      terminationNoticeDays,
      status = "active",
    } = body

    // Validate required fields
    if (!tenantId || !propertyId || !unitNumber || !areaSqft || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: tenantId, propertyId, unitNumber, areaSqft, startDate, endDate" },
        { status: 400 }
      )
    }

    // Validate tenant exists
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    })
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Validate property exists
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
    })
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Check for overlapping leases on the same unit
    const existingLease = await db.query.leases.findFirst({
      where: and(
        eq(leases.propertyId, propertyId),
        eq(leases.unitNumber, unitNumber),
        eq(leases.status, "active")
      ),
    })
    if (existingLease) {
      return NextResponse.json(
        { error: `Unit ${unitNumber} already has an active lease` },
        { status: 400 }
      )
    }

    // Create lease
    const [newLease] = await db
      .insert(leases)
      .values({
        tenantId,
        propertyId,
        unitNumber,
        floor: floor || null,
        zone: zone || null,
        areaSqft: areaSqft.toString(),
        leaseType,
        baseRent: baseRent?.toString() || null,
        revenueSharePercentage: revenueSharePercentage?.toString() || null,
        camCharges: camCharges?.toString() || null,
        securityDeposit: securityDeposit?.toString() || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        escalationRate: escalationRate?.toString() || null,
        escalationFrequency: escalationFrequency || null,
        status,
        // Store additional fields in terms JSON
        terms: {
          lockInPeriod: lockInPeriod || null,
          fitOutPeriod: fitOutPeriod || null,
          rentFreePeriod: rentFreePeriod || null,
          terminationNoticeDays: terminationNoticeDays || 90,
          maintenanceCharges: maintenanceCharges || null,
        },
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newLease,
      message: "Lease created successfully",
    })
  } catch (error) {
    console.error("Create lease error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
