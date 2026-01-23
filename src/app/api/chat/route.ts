import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversations, messages, tenants, leases, workOrders, invoices } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

// Smart response generator for common tenant queries
async function generateSmartResponse(
  message: string,
  tenantId: string,
  propertyId: string
): Promise<{
  response: string
  confidence: number
  actionsTaken: string[]
  requiresApproval: boolean
}> {
  const lowerMessage = message.toLowerCase()
  
  // Fetch tenant data for context
  let tenantData = null
  let activeLease = null
  let recentInvoices: typeof invoices.$inferSelect[] = []
  let recentWorkOrders: typeof workOrders.$inferSelect[] = []
  
  try {
    tenantData = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    })
    
    if (tenantData) {
      activeLease = await db.query.leases.findFirst({
        where: and(eq(leases.tenantId, tenantId), eq(leases.status, "active")),
      })
      
      recentInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.tenantId, tenantId))
        .orderBy(desc(invoices.createdAt))
        .limit(5)
        
      recentWorkOrders = await db
        .select()
        .from(workOrders)
        .where(eq(workOrders.tenantId, tenantId))
        .orderBy(desc(workOrders.createdAt))
        .limit(5)
    }
  } catch (e) {
    console.log("Could not fetch tenant context:", e)
  }
  
  // Lease-related queries
  if (lowerMessage.includes("lease") || lowerMessage.includes("rent") || lowerMessage.includes("agreement")) {
    if (activeLease) {
      const endDate = new Date(activeLease.endDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
      const rent = parseFloat(activeLease.baseRent || "0").toLocaleString("en-IN")
      return {
        response: `Here are your lease details:\n\n**Unit:** ${activeLease.unitNumber}\n**Area:** ${activeLease.areaSqft} sq.ft\n**Monthly Rent:** ₹${rent}\n**Lease End Date:** ${endDate}\n**Status:** ${activeLease.status}\n\nIf you need a copy of your lease agreement or have questions about renewal, please contact mall management directly.`,
        confidence: 0.9,
        actionsTaken: ["fetch_lease_details"],
        requiresApproval: false,
      }
    }
    return {
      response: "I couldn't find an active lease on your account. Please contact mall management for assistance with lease-related inquiries.",
      confidence: 0.7,
      actionsTaken: [],
      requiresApproval: false,
    }
  }
  
  // Invoice/payment queries
  if (lowerMessage.includes("invoice") || lowerMessage.includes("payment") || lowerMessage.includes("bill") || lowerMessage.includes("due")) {
    if (recentInvoices.length > 0) {
      const pendingInvoices = recentInvoices.filter(i => i.status === "pending" || i.status === "overdue")
      if (pendingInvoices.length > 0) {
        const totalDue = pendingInvoices.reduce((sum, i) => sum + parseFloat(i.totalAmount || "0"), 0)
        return {
          response: `You have **${pendingInvoices.length} pending invoice(s)** with a total amount of **₹${totalDue.toLocaleString("en-IN")}**.\n\nPlease make payments before the due date to avoid late fees. You can view all your invoices in the Financials tab of your tenant dashboard.`,
          confidence: 0.85,
          actionsTaken: ["fetch_invoice_summary"],
          requiresApproval: false,
        }
      }
      return {
        response: "Great news! You have no pending invoices. All your payments are up to date. Thank you for your timely payments!",
        confidence: 0.9,
        actionsTaken: ["fetch_invoice_summary"],
        requiresApproval: false,
      }
    }
    return {
      response: "I couldn't find any invoice records. If you believe this is an error, please contact the accounts department.",
      confidence: 0.7,
      actionsTaken: [],
      requiresApproval: false,
    }
  }
  
  // Maintenance/work order queries
  if (lowerMessage.includes("maintenance") || lowerMessage.includes("repair") || lowerMessage.includes("fix") || lowerMessage.includes("broken") || lowerMessage.includes("issue") || lowerMessage.includes("problem") || lowerMessage.includes("work order")) {
    if (lowerMessage.includes("status") || lowerMessage.includes("check") || lowerMessage.includes("update")) {
      const openOrders = recentWorkOrders.filter(w => w.status === "open" || w.status === "in_progress")
      if (openOrders.length > 0) {
        const orderList = openOrders.map(w => `• **${w.workOrderNumber}**: ${w.title} (${w.status})`).join("\n")
        return {
          response: `Here are your active work orders:\n\n${orderList}\n\nOur maintenance team is working on these. You'll be notified when they're resolved.`,
          confidence: 0.85,
          actionsTaken: ["fetch_work_order_status"],
          requiresApproval: false,
        }
      }
      return {
        response: "You don't have any active maintenance requests. If you need to report an issue, please use the 'Report Issue' button or describe the problem here.",
        confidence: 0.85,
        actionsTaken: ["fetch_work_order_status"],
        requiresApproval: false,
      }
    }
    return {
      response: "I understand you're experiencing an issue. To help you better, please provide:\n\n1. **Location** of the problem (e.g., store entrance, restroom)\n2. **Description** of the issue\n3. **Urgency** level (routine, urgent, or emergency)\n\nAlternatively, you can click the 'Report Issue' button to create a formal maintenance request.",
      confidence: 0.8,
      actionsTaken: [],
      requiresApproval: false,
    }
  }
  
  // Mall hours query
  if (lowerMessage.includes("hour") || lowerMessage.includes("timing") || lowerMessage.includes("open") || lowerMessage.includes("close")) {
    return {
      response: "**Mall Operating Hours:**\n\n• **Monday - Friday:** 10:00 AM - 10:00 PM\n• **Saturday - Sunday:** 10:00 AM - 11:00 PM\n• **Public Holidays:** 11:00 AM - 10:00 PM\n\nPlease note that loading/unloading is permitted between 6:00 AM - 10:00 AM only.",
      confidence: 0.9,
      actionsTaken: ["fetch_mall_hours"],
      requiresApproval: false,
    }
  }
  
  // Contact/help queries
  if (lowerMessage.includes("contact") || lowerMessage.includes("help") || lowerMessage.includes("support") || lowerMessage.includes("manager") || lowerMessage.includes("emergency")) {
    return {
      response: "**Mall Management Contacts:**\n\n• **General Inquiries:** +91-98765-43210\n• **Maintenance (24/7):** +91-98765-43211\n• **Accounts/Billing:** accounts@mall.com\n• **Emergency:** +91-98765-00000\n\n**Office Hours:** Monday - Saturday, 9:00 AM - 6:00 PM",
      confidence: 0.9,
      actionsTaken: ["provide_contacts"],
      requiresApproval: false,
    }
  }
  
  // Greeting
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey") || lowerMessage === "hi" || lowerMessage === "hello") {
    const name = tenantData?.contactPerson || tenantData?.businessName || "there"
    return {
      response: `Hello ${name}! 👋 I'm your Tenant Relations Assistant. How can I help you today?\n\nI can assist you with:\n• **Lease Information** - View your lease details\n• **Payments & Invoices** - Check dues and payment history\n• **Maintenance Requests** - Report issues or check status\n• **Mall Information** - Hours, contacts, and policies\n\nJust type your question or use the quick buttons below!`,
      confidence: 0.95,
      actionsTaken: [],
      requiresApproval: false,
    }
  }
  
  // Default response
  return {
    response: "Thank you for your message. I'm here to help with:\n\n• Lease and rental inquiries\n• Invoice and payment questions\n• Maintenance requests\n• Mall information and policies\n\nCould you please provide more details about what you need help with? Or you can click one of the quick action buttons below.",
    confidence: 0.6,
    actionsTaken: [],
    requiresApproval: false,
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, tenantId, message, conversationId } = body

    if (!propertyId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get or create conversation
    let conversation = conversationId
      ? await db.query.conversations.findFirst({
          where: eq(conversations.id, conversationId),
        })
      : null

    if (!conversation) {
      const newConversationId = crypto.randomUUID()
      await db.insert(conversations).values({
        id: newConversationId,
        propertyId,
        tenantId: tenantId || null,
        assignedAgent: "tenant_relations",
        status: "active",
        category: message.slice(0, 100),
      })
      conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, newConversationId),
      })
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      )
    }

    // Save user message
    const userMessageId = crypto.randomUUID()
    await db.insert(messages).values({
      id: userMessageId,
      conversationId: conversation.id,
      senderType: tenantId ? "tenant" : "staff",
      senderId: tenantId || session.user.id,
      content: message,
    })

    // Generate smart response (works without AI API)
    const result = await generateSmartResponse(
      message,
      tenantId || session.user.id,
      propertyId
    )

    // Save assistant response
    const assistantMessageId = crypto.randomUUID()
    await db.insert(messages).values({
      id: assistantMessageId,
      conversationId: conversation.id,
      senderType: "agent",
      content: result.response,
      metadata: {
        confidence: result.confidence,
        actionsTaken: result.actionsTaken,
        requiresApproval: result.requiresApproval,
      },
    })

    // Update conversation
    await db
      .update(conversations)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversation.id))

    return NextResponse.json({
      conversationId: conversation.id,
      messageId: assistantMessageId,
      response: result.response,
      confidence: result.confidence,
      actionsTaken: result.actionsTaken,
      requiresApproval: result.requiresApproval,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 }
      )
    }

    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)

    return NextResponse.json({
      conversation,
      messages: chatMessages,
    })
  } catch (error) {
    console.error("Get chat error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

