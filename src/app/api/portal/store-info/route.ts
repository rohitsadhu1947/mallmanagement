import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { tenants, leases, properties } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()

    // For demo purposes, return first tenant with active lease if no session
    // In production, this would be tied to the logged-in tenant user
    
    // Try to find a tenant with an active lease
    const activeLease = await db.query.leases.findFirst({
      where: eq(leases.status, "active"),
      with: {
        tenant: true,
        property: true,
      },
    })

    if (activeLease && activeLease.tenant && activeLease.property) {
      return NextResponse.json({
        propertyName: activeLease.property.name,
        tenantName: activeLease.tenant.businessName,
        unitNumber: activeLease.unitNumber,
        floor: activeLease.floor ? `Floor ${activeLease.floor}` : "Ground Floor",
        areaSqft: activeLease.areaSqft,
        leaseEnd: activeLease.endDate,
      })
    }

    // Fallback: get first tenant with property
    const tenant = await db.query.tenants.findFirst({
      with: {
        property: true,
      },
    })

    if (tenant && tenant.property) {
      return NextResponse.json({
        propertyName: tenant.property.name,
        tenantName: tenant.businessName,
        unitNumber: "N/A",
        floor: "N/A",
        areaSqft: "N/A",
        leaseEnd: "N/A",
      })
    }

    // Default response
    return NextResponse.json({
      propertyName: "Mall Property",
      tenantName: "Your Store",
      unitNumber: "N/A",
      floor: "N/A",
      areaSqft: "N/A",
      leaseEnd: "N/A",
    })
  } catch (error) {
    console.error("Error fetching store info:", error)
    return NextResponse.json(
      { error: "Failed to fetch store info" },
      { status: 500 }
    )
  }
}

