import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { invoices, payments, leases } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { invalidateEntityCache } from "@/lib/cache"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, paymentDate, paymentMethod, referenceNumber, notes } = body

    if (!amount || !paymentDate) {
      return NextResponse.json({ error: "Amount and payment date are required" }, { status: 400 })
    }

    // Check if invoice exists
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, params.id),
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 })
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json({ error: "Cannot record payment for cancelled invoice" }, { status: 400 })
    }

    // Create payment record
    const paymentId = crypto.randomUUID()
    const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(6, "0")}`

    await db.insert(payments).values({
      id: paymentId,
      invoiceId: params.id,
      amount: amount.toString(),
      paymentDate: new Date(paymentDate),
      paymentMethod: paymentMethod || "bank_transfer",
      referenceNumber,
      receiptNumber,
      status: "completed",
      processedBy: session.user.id,
      notes,
    })

    // Calculate total paid amount
    const existingPaid = parseFloat(invoice.paidAmount || "0")
    const newPaid = existingPaid + parseFloat(amount)
    const totalAmount = parseFloat(invoice.totalAmount)

    // Update invoice status
    const newStatus = newPaid >= totalAmount ? "paid" : "partially_paid"

    await db
      .update(invoices)
      .set({
        paidAmount: newPaid.toString(),
        paidDate: new Date(paymentDate),
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, params.id))

    // Invalidate cache
    if (invoice.leaseId) {
      const lease = await db.query.leases.findFirst({
        where: eq(leases.id, invoice.leaseId),
      })
      if (lease?.propertyId) {
        await invalidateEntityCache("invoice", params.id, lease.propertyId)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      receiptNumber,
      newStatus,
    })
  } catch (error) {
    console.error("Record payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

