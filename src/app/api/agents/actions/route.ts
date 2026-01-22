import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { agentActions, agents } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { requirePermission, PERMISSIONS } from "@/lib/auth/rbac"

// GET: Fetch agent actions with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const agentId = searchParams.get("agentId")
    const limit = parseInt(searchParams.get("limit") || "50")

    const actions = await db
      .select({
        action: agentActions,
        agent: agents,
      })
      .from(agentActions)
      .leftJoin(agents, eq(agentActions.agentId, agents.id))
      .where(
        and(
          status ? eq(agentActions.status, status) : undefined,
          agentId ? eq(agentActions.agentId, agentId) : undefined
        )
      )
      .orderBy(desc(agentActions.createdAt))
      .limit(limit)

    const result = actions.map(({ action, agent }) => ({
      id: action.id,
      agentId: action.agentId,
      agentName: agent?.name || "Unknown Agent",
      agentType: agent?.persona || "unknown",
      actionType: action.actionType,
      description: action.description,
      reasoning: action.reasoning,
      confidence: parseFloat(action.confidence || "0"),
      status: action.status,
      impact: action.impact || "medium",
      entityType: action.entityType,
      entityId: action.entityId,
      requiresApproval: action.requiresApproval,
      createdAt: action.createdAt,
      executedAt: action.executedAt,
      approvedAt: action.approvedAt,
      approvedBy: action.approvedBy,
      metadata: action.metadata,
    }))

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Get agent actions error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch agent actions" },
      { status: 500 }
    )
  }
}

// POST: Approve or reject an agent action
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { actionId, decision, reason } = body

    if (!actionId || !decision) {
      return NextResponse.json(
        { success: false, error: "Action ID and decision are required" },
        { status: 400 }
      )
    }

    if (!["approve", "reject"].includes(decision)) {
      return NextResponse.json(
        { success: false, error: "Decision must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    // Check RBAC permission for approve/reject
    const permissionToCheck = decision === "approve" 
      ? PERMISSIONS.AGENTS_APPROVE 
      : PERMISSIONS.AGENTS_REJECT
    const { authorized, error } = await requirePermission(permissionToCheck)
    
    if (!authorized) {
      return NextResponse.json({ success: false, error }, { status: 403 })
    }

    // Get the action
    const action = await db.query.agentActions.findFirst({
      where: eq(agentActions.id, actionId),
    })

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action not found" },
        { status: 404 }
      )
    }

    if (action.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Action has already been processed" },
        { status: 400 }
      )
    }

    // Update the action
    const newStatus = decision === "approve" ? "approved" : "rejected"
    const updateData: {
      status: string
      approvedBy?: string
      approvedAt?: Date
      executedAt?: Date
      metadata?: Record<string, unknown>
    } = {
      status: newStatus,
      approvedBy: session.user.id,
      approvedAt: new Date(),
    }

    // If approved, also mark as executed (for demo purposes)
    if (decision === "approve") {
      updateData.executedAt = new Date()
      updateData.status = "executed"
    }

    // Add rejection reason to metadata if provided
    if (decision === "reject" && reason) {
      updateData.metadata = {
        ...(action.metadata as Record<string, unknown> || {}),
        rejectionReason: reason,
      }
    }

    await db
      .update(agentActions)
      .set(updateData)
      .where(eq(agentActions.id, actionId))

    // Fetch updated action
    const updatedAction = await db.query.agentActions.findFirst({
      where: eq(agentActions.id, actionId),
    })

    return NextResponse.json({
      success: true,
      message: `Action ${decision === "approve" ? "approved and executed" : "rejected"} successfully`,
      data: updatedAction,
    })
  } catch (error) {
    console.error("Process agent action error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process action" },
      { status: 500 }
    )
  }
}

// PATCH: Update action status (for bulk operations)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { actionIds, decision } = body

    if (!actionIds || !Array.isArray(actionIds) || actionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Action IDs array is required" },
        { status: 400 }
      )
    }

    if (!["approve", "reject"].includes(decision)) {
      return NextResponse.json(
        { success: false, error: "Decision must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    const newStatus = decision === "approve" ? "executed" : "rejected"
    let processed = 0

    for (const actionId of actionIds) {
      try {
        await db
          .update(agentActions)
          .set({
            status: newStatus,
            approvedBy: session.user.id,
            approvedAt: new Date(),
            executedAt: decision === "approve" ? new Date() : undefined,
          })
          .where(
            and(
              eq(agentActions.id, actionId),
              eq(agentActions.status, "pending")
            )
          )
        processed++
      } catch (err) {
        console.error(`Failed to process action ${actionId}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${processed} actions ${decision === "approve" ? "approved" : "rejected"} successfully`,
      processed,
      total: actionIds.length,
    })
  } catch (error) {
    console.error("Bulk process actions error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process actions" },
      { status: 500 }
    )
  }
}

