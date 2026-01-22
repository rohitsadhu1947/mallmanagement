import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { invoices, leases, tenants } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { invalidateEntityCache } from "@/lib/cache"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, params.id),
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get related lease and tenant info
    let lease = null
    let tenant = null
    if (invoice.leaseId) {
      lease = await db.query.leases.findFirst({
        where: eq(leases.id, invoice.leaseId),
      })
      if (lease?.tenantId) {
        tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, lease.tenantId),
        })
      }
    }

    return NextResponse.json({
      ...invoice,
      lease: lease ? { id: lease.id, unitNumber: lease.unitNumber } : null,
      tenant: tenant ? {
        id: tenant.id,
        businessName: tenant.businessName,
        contactPerson: tenant.contactPerson,
        email: tenant.email,
      } : null,
    })
  } catch (error) {
    console.error("Get invoice error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, paidAmount, paidDate, notes } = body

    // Check if invoice exists
    const existingInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, params.id),
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Build update object
    const updateData: Record<string, any> = { updatedAt: new Date() }
    if (status !== undefined) updateData.status = status
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount
    if (paidDate !== undefined) updateData.paidDate = new Date(paidDate)
    if (notes !== undefined) updateData.notes = notes

    const [updatedInvoice] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, params.id))
      .returning()

    // Invalidate cache
    if (existingInvoice.leaseId) {
      const lease = await db.query.leases.findFirst({
        where: eq(leases.id, existingInvoice.leaseId),
      })
      if (lease?.propertyId) {
        await invalidateEntityCache("invoice", params.id, lease.propertyId)
      }
    }

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Update invoice error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Soft delete by setting status to cancelled
    const [deletedInvoice] = await db
      .update(invoices)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(invoices.id, params.id))
      .returning()

    if (!deletedInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Invoice cancelled successfully" })
  } catch (error) {
    console.error("Delete invoice error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

