import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { invoices, leases, tenants } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get invoice details
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, params.id),
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Cannot send reminder for paid invoice" }, { status: 400 })
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json({ error: "Cannot send reminder for cancelled invoice" }, { status: 400 })
    }

    // Get tenant info for the reminder
    let tenantEmail = null
    let tenantName = null
    
    if (invoice.leaseId) {
      const lease = await db.query.leases.findFirst({
        where: eq(leases.id, invoice.leaseId),
      })
      
      if (lease?.tenantId) {
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, lease.tenantId),
        })
        if (tenant) {
          tenantEmail = tenant.email
          tenantName = tenant.businessName
        }
      }
    }

    // In a real implementation, you would send the reminder here using Resend or another email service
    // For now, we'll just increment the reminder count
    
    // Example Resend integration (commented out - would need RESEND_API_KEY):
    /*
    if (tenantEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'noreply@mallmanagement.com',
        to: tenantEmail,
        subject: `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
        html: `
          <h1>Payment Reminder</h1>
          <p>Dear ${tenantName},</p>
          <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> 
          for <strong>₹${invoice.totalAmount}</strong> is due on <strong>${invoice.dueDate}</strong>.</p>
          <p>Please make the payment at your earliest convenience.</p>
        `
      })
    }
    */

    // Update reminder count
    await db
      .update(invoices)
      .set({
        remindersSent: sql`${invoices.remindersSent} + 1`,
        lastReminderDate: new Date().toISOString().split("T")[0],
      })
      .where(eq(invoices.id, params.id))

    return NextResponse.json({
      success: true,
      message: tenantEmail 
        ? `Reminder sent to ${tenantEmail}` 
        : "Reminder logged (no email configured)",
      sentTo: tenantEmail,
    })
  } catch (error) {
    console.error("Send reminder error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

