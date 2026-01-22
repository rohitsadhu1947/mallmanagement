import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversations, messages } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { handleTenantChat } from "@/lib/agents/implementations/tenant-relations"

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
        agentType: "tenant_relations",
        status: "open",
        subject: message.slice(0, 100),
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
      role: "user",
      content: message,
    })

    // Get conversation history
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(messages.createdAt)

    const conversationHistory = history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: msg.createdAt,
    }))

    // Execute agent
    const result = await handleTenantChat(
      propertyId,
      tenantId || session.user.id,
      message,
      conversationHistory
    )

    // Save assistant response
    const assistantMessageId = crypto.randomUUID()
    await db.insert(messages).values({
      id: assistantMessageId,
      conversationId: conversation.id,
      role: "assistant",
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
        lastMessageAt: new Date(),
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

