import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { invoices, leases, tenants } from "@/lib/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { getCachedOrFetch, CACHE_TTL, deleteCache } from "@/lib/cache"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const propertyId = searchParams.get("propertyId")
    const tenantId = searchParams.get("tenantId")
    const refresh = searchParams.get("refresh") === "true"

    // Cache key based on filters
    const cacheKey = `invoices:list:${propertyId || "all"}:${tenantId || "all"}:${status || "all"}`

    // Invalidate cache if refresh requested
    if (refresh) {
      await deleteCache(cacheKey)
    }

    const result = await getCachedOrFetch(
      cacheKey,
      async () => {
        // Build where conditions
        const conditions = []
        if (status) conditions.push(eq(invoices.status, status))
        if (tenantId) conditions.push(eq(tenants.id, tenantId))
        if (propertyId) conditions.push(eq(leases.propertyId, propertyId))

        const invoicesWithDetails = await db
          .select({
            invoice: invoices,
            lease: leases,
            tenant: tenants,
          })
          .from(invoices)
          .leftJoin(leases, eq(invoices.leaseId, leases.id))
          .leftJoin(tenants, eq(leases.tenantId, tenants.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(invoices.createdAt))

        return invoicesWithDetails.map(({ invoice, lease, tenant }) => ({
          ...invoice,
          lease: lease
            ? {
                id: lease.id,
                unitNumber: lease.unitNumber,
              }
            : null,
          tenant: tenant
            ? {
                id: tenant.id,
                businessName: tenant.businessName,
                contactPerson: tenant.contactPerson,
                email: tenant.email,
              }
            : null,
        }))
      },
      CACHE_TTL.MEDIUM // 5 minutes
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get invoices error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      leaseId,
      invoiceType,
      periodStart,
      periodEnd,
      amount,
      gstAmount,
      dueDate,
    } = body

    if (!leaseId || !invoiceType || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const invoiceId = crypto.randomUUID()
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 100000
    )
      .toString()
      .padStart(6, "0")}`

    const totalAmount = parseFloat(amount) + parseFloat(gstAmount || "0")

    await db.insert(invoices).values({
      id: invoiceId,
      leaseId,
      invoiceNumber,
      invoiceType,
      periodStart,
      periodEnd,
      amount,
      gstAmount: gstAmount || "0",
      totalAmount: totalAmount.toString(),
      dueDate,
      status: "pending",
      createdBy: session.user.id,
    })

    const newInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
    })

    // Invalidate invoice list cache
    await deleteCache(`invoices:list:all:all`)
    await deleteCache(`invoices:list:all:pending`)

    return NextResponse.json(newInvoice, { status: 201 })
  } catch (error) {
    console.error("Create invoice error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

