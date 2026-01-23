import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { agents, agentActions, agentDecisions } from "@/lib/db/schema"
import { eq, desc, count, sql, and, gte } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all agents with their stats
    const agentsWithStats = await db
      .select({
        agent: agents,
        actionsToday: sql<number>`(
          SELECT COUNT(*) FROM agent_actions 
          WHERE agent_actions.agent_id = ${agents.id} 
          AND agent_actions.created_at >= CURRENT_DATE
        )`,
        pendingApprovals: sql<number>`(
          SELECT COUNT(*) FROM agent_actions 
          WHERE agent_actions.agent_id = ${agents.id} 
          AND agent_actions.status = 'pending'
        )`,
        totalActions: sql<number>`(
          SELECT COUNT(*) FROM agent_actions 
          WHERE agent_actions.agent_id = ${agents.id}
        )`,
        executedActions: sql<number>`(
          SELECT COUNT(*) FROM agent_actions 
          WHERE agent_actions.agent_id = ${agents.id} 
          AND agent_actions.status = 'executed'
        )`,
      })
      .from(agents)
      .where(eq(agents.status, "active"))
      .orderBy(agents.name)

    // Calculate success rate for each agent
    const result = agentsWithStats.map(({ agent, actionsToday, pendingApprovals, totalActions, executedActions }) => {
      const successRate = totalActions > 0 ? (executedActions / totalActions) * 100 : 0
      
      return {
        ...agent,
        stats: {
          actionsToday,
          pendingApprovals,
          totalActions,
          executedActions,
          successRate: Math.round(successRate * 10) / 10,
          avgConfidence: 0.85, // Default, would be calculated from decisions
        },
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Get agents error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch agents" },
      { status: 500 }
    )
  }
}

// Get agent activity (pending actions)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "get_pending_actions") {
      const pendingActions = await db
        .select({
          action: agentActions,
          agent: agents,
        })
        .from(agentActions)
        .leftJoin(agents, eq(agentActions.agentId, agents.id))
        .where(eq(agentActions.status, "pending"))
        .orderBy(desc(agentActions.createdAt))
        .limit(50)

      const result = pendingActions.map(({ action, agent }) => ({
        id: action.id,
        agentId: action.agentId,
        agentName: agent?.name || "Unknown Agent",
        agentType: agent?.type || "unknown",
        actionType: action.actionType,
        description: action.trigger || action.reasoning || "No description",
        reasoning: action.reasoning,
        confidence: parseFloat(action.confidence || "0"),
        status: action.status,
        impact: (action.metadata as Record<string, unknown>)?.impact as string || "medium",
        entityType: action.entityType,
        entityId: action.entityId,
        createdAt: action.createdAt,
        data: action.metadata,
      }))

      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Agent action error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to perform action" },
      { status: 500 }
    )
  }
}

