import { NextRequest, NextResponse } from "next/server"

// Pure rule-based response generator - no database dependency
function generateRuleBasedResponse(message: string): {
  response: string
  confidence: number
  actionsTaken: string[]
  requiresApproval: boolean
} {
  const lowerMessage = message.toLowerCase().trim()
  
  // Greeting patterns
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy)[\s!?.]*$/i.test(lowerMessage) || 
      lowerMessage.includes("hello") || lowerMessage.includes("hi there")) {
    return {
      response: `Hello! 👋 I'm your Tenant Relations Assistant. How can I help you today?\n\nI can assist you with:\n• **Lease Information** - View your lease details\n• **Payments & Invoices** - Check dues and payment history\n• **Maintenance Requests** - Report issues or check status\n• **Mall Information** - Hours, contacts, and policies\n\nJust type your question or use the quick buttons below!`,
      confidence: 0.95,
      actionsTaken: ["greeting"],
      requiresApproval: false,
    }
  }
  
  // Lease-related queries
  if (lowerMessage.includes("lease") || lowerMessage.includes("agreement") || 
      lowerMessage.includes("contract") || lowerMessage.includes("renewal") ||
      (lowerMessage.includes("rent") && (lowerMessage.includes("detail") || lowerMessage.includes("how much")))) {
    return {
      response: `**Lease Information:**\n\nTo view your complete lease details, please visit the **Lease** tab in your tenant dashboard where you can find:\n\n• Unit number and floor details\n• Lease start and end dates\n• Monthly rent amount\n• Security deposit information\n• Terms and conditions\n\n**For lease renewal or modifications**, please contact our leasing team:\n📞 +91-98765-43212\n📧 leasing@mall.com\n\nWould you like help with anything else?`,
      confidence: 0.9,
      actionsTaken: ["provide_lease_info"],
      requiresApproval: false,
    }
  }
  
  // Invoice/payment/billing queries
  if (lowerMessage.includes("invoice") || lowerMessage.includes("payment") || 
      lowerMessage.includes("bill") || lowerMessage.includes("due") ||
      lowerMessage.includes("outstanding") || lowerMessage.includes("balance") ||
      lowerMessage.includes("pay") || lowerMessage.includes("receipt")) {
    return {
      response: `**Payment & Invoice Information:**\n\nYou can view all your invoices and payment history in the **Financials** tab of your dashboard.\n\n**Payment Methods:**\n• Bank Transfer (NEFT/RTGS)\n• Cheque (payable to "Mall Management Pvt Ltd")\n• Online Payment Portal\n\n**Important Dates:**\n• Rent Due: 5th of every month\n• Late Fee: 2% after 10th\n• Grace Period: 5 days\n\n**For payment queries:**\n📞 +91-98765-43213\n📧 accounts@mall.com\n\nNeed help with something specific?`,
      confidence: 0.9,
      actionsTaken: ["provide_payment_info"],
      requiresApproval: false,
    }
  }
  
  // Maintenance/repair/issue queries
  if (lowerMessage.includes("maintenance") || lowerMessage.includes("repair") || 
      lowerMessage.includes("fix") || lowerMessage.includes("broken") ||
      lowerMessage.includes("not working") || lowerMessage.includes("damage") ||
      lowerMessage.includes("leak") || lowerMessage.includes("ac") ||
      lowerMessage.includes("electrical") || lowerMessage.includes("plumbing")) {
    return {
      response: `**Maintenance Request:**\n\nI can help you report a maintenance issue. To submit a formal request:\n\n1. Click the **"Report Issue"** button below, or\n2. Visit the **Work Orders** section in your dashboard\n\n**For urgent issues, contact:**\n📞 Maintenance Hotline: +91-98765-43211 (24/7)\n\n**Please provide when reporting:**\n• Location of the issue\n• Description of the problem\n• Photos if possible\n• Preferred time for inspection\n\n**Response Times:**\n• Emergency: 1-2 hours\n• Urgent: Same day\n• Routine: 24-48 hours\n\nWhat type of issue are you experiencing?`,
      confidence: 0.9,
      actionsTaken: ["provide_maintenance_info"],
      requiresApproval: false,
    }
  }
  
  // Work order status queries
  if (lowerMessage.includes("work order") || lowerMessage.includes("request status") ||
      (lowerMessage.includes("status") && (lowerMessage.includes("repair") || lowerMessage.includes("maintenance")))) {
    return {
      response: `**Work Order Status:**\n\nTo check the status of your maintenance requests:\n\n1. Go to **Work Orders** tab in your dashboard\n2. You'll see all your requests with current status:\n   • 🟡 **Open** - Request received\n   • 🔵 **In Progress** - Being worked on\n   • 🟢 **Resolved** - Completed\n   • ⚫ **Closed** - Verified & closed\n\nYou will also receive email/SMS notifications for status updates.\n\n**Need to follow up?**\n📞 +91-98765-43211\n\nAnything else I can help with?`,
      confidence: 0.85,
      actionsTaken: ["provide_work_order_info"],
      requiresApproval: false,
    }
  }
  
  // Mall hours/timing queries
  if (lowerMessage.includes("hour") || lowerMessage.includes("timing") || 
      lowerMessage.includes("open") || lowerMessage.includes("close") ||
      lowerMessage.includes("time") || lowerMessage.includes("schedule")) {
    return {
      response: `**Mall Operating Hours:**\n\n🕐 **Regular Hours:**\n• Monday - Friday: 10:00 AM - 10:00 PM\n• Saturday - Sunday: 10:00 AM - 11:00 PM\n• Public Holidays: 11:00 AM - 10:00 PM\n\n🚚 **Loading/Unloading:**\n• Permitted: 6:00 AM - 10:00 AM only\n• Dock area access required\n\n🔐 **Store Access (Non-operating hours):**\n• Contact security: +91-98765-43214\n• Prior approval required\n\n**Upcoming Changes:**\nExtended hours during festive seasons will be communicated via email.\n\nAnything else you'd like to know?`,
      confidence: 0.95,
      actionsTaken: ["provide_mall_hours"],
      requiresApproval: false,
    }
  }
  
  // Contact/help/support queries
  if (lowerMessage.includes("contact") || lowerMessage.includes("phone") ||
      lowerMessage.includes("email") || lowerMessage.includes("support") ||
      lowerMessage.includes("help") || lowerMessage.includes("manager") ||
      lowerMessage.includes("emergency") || lowerMessage.includes("call")) {
    return {
      response: `**Mall Management Contacts:**\n\n📞 **Phone Numbers:**\n• General Inquiries: +91-98765-43210\n• Maintenance (24/7): +91-98765-43211\n• Leasing: +91-98765-43212\n• Accounts/Billing: +91-98765-43213\n• Security: +91-98765-43214\n• Emergency: +91-98765-00000\n\n📧 **Email:**\n• General: info@mall.com\n• Accounts: accounts@mall.com\n• Leasing: leasing@mall.com\n• Maintenance: maintenance@mall.com\n\n🏢 **Office Hours:**\nMonday - Saturday: 9:00 AM - 6:00 PM\n\n🚨 **Emergency?** Call +91-98765-00000 immediately!\n\nHow else can I assist you?`,
      confidence: 0.95,
      actionsTaken: ["provide_contacts"],
      requiresApproval: false,
    }
  }
  
  // Parking queries
  if (lowerMessage.includes("parking") || lowerMessage.includes("vehicle") || lowerMessage.includes("car")) {
    return {
      response: `**Parking Information:**\n\n🚗 **Tenant Parking:**\n• Dedicated parking passes available\n• Apply through mall management office\n• Monthly pass: ₹2,000\n\n🅿️ **Customer Parking:**\n• First 2 hours free with purchase\n• Validation at store POS\n\n📍 **Locations:**\n• Basement B1 & B2\n• Ground floor (limited)\n\n**For parking queries:**\n📞 +91-98765-43215\n\nNeed help with something else?`,
      confidence: 0.9,
      actionsTaken: ["provide_parking_info"],
      requiresApproval: false,
    }
  }
  
  // Thank you responses
  if (lowerMessage.includes("thank") || lowerMessage.includes("thanks") || lowerMessage.includes("thx")) {
    return {
      response: `You're welcome! 😊 I'm always here to help.\n\nIf you have any more questions, feel free to ask. Have a great day! 🌟`,
      confidence: 0.95,
      actionsTaken: ["acknowledge_thanks"],
      requiresApproval: false,
    }
  }
  
  // Default response for unrecognized queries
  return {
    response: `Thank you for your message! I'm here to help with:\n\n• 📋 **Lease Information** - Details about your rental agreement\n• 💰 **Payments & Invoices** - Billing and payment queries\n• 🔧 **Maintenance** - Report issues or check repair status\n• 🕐 **Mall Hours** - Operating schedules\n• 📞 **Contacts** - Mall management numbers\n• 🅿️ **Parking** - Parking passes and info\n\nPlease try asking about one of these topics, or click the quick action buttons below for common requests.\n\n**Need immediate help?** Call +91-98765-43210`,
    confidence: 0.6,
    actionsTaken: ["provide_help_menu"],
    requiresApproval: false,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Generate rule-based response (no database dependency)
    const result = generateRuleBasedResponse(message)

    return NextResponse.json({
      conversationId: crypto.randomUUID(),
      messageId: crypto.randomUUID(),
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
