import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { agentActions, agents } from "@/lib/db/schema"
import { desc, eq, gte } from "drizzle-orm"
import { 
  getAgentActivities, 
  pushAgentActivity, 
  CACHE_KEYS, 
  getCachedOrFetch, 
  CACHE_TTL 
} from "@/lib/cache"

// Store for active connections
const clients = new Map<string, ReadableStreamDefaultController>()

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  const searchParams = request.nextUrl.searchParams
  const propertyId = searchParams.get("propertyId") || ""
  
  const stream = new ReadableStream({
    start(controller) {
      const clientId = `${propertyId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      clients.set(clientId, controller)
      
      // Send initial connection message
      const connectEvent = `event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`
      controller.enqueue(encoder.encode(connectEvent))
      
      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`
          controller.enqueue(encoder.encode(heartbeat))
        } catch {
          clearInterval(heartbeatInterval)
          clients.delete(clientId)
        }
      }, 30000)
      
      // Fetch and send recent activity every 5 seconds
      const activityInterval = setInterval(async () => {
        try {
          // First try to get from Redis cache for faster response
          const cachedActivities = await getAgentActivities(propertyId || "all", 10)
          
          if (cachedActivities.length > 0) {
            const activityEvent = `event: activity\ndata: ${JSON.stringify({
              activities: cachedActivities,
              timestamp: new Date().toISOString(),
              source: "cache",
            })}\n\n`
            controller.enqueue(encoder.encode(activityEvent))
          } else {
            // Fallback to database query
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
            
            const recentActivity = await db
              .select({
                action: agentActions,
                agent: agents,
              })
              .from(agentActions)
              .leftJoin(agents, eq(agentActions.agentId, agents.id))
              .where(gte(agentActions.createdAt, fiveMinutesAgo))
              .orderBy(desc(agentActions.createdAt))
              .limit(10)
            
            if (recentActivity.length > 0) {
              const activities = recentActivity.map((a) => ({
                id: a.action.id,
                agentId: a.action.agentId,
                agentName: a.agent?.name || "Unknown Agent",
                agentPersona: a.agent?.persona,
                actionType: a.action.actionType,
                description: a.action.description,
                status: a.action.status,
                confidence: a.action.confidence,
                timestamp: a.action.createdAt,
              }))
              
              // Cache the activities for future requests
              for (const activity of activities) {
                await pushAgentActivity(propertyId || "all", {
                  id: activity.id,
                  agentId: activity.agentId,
                  agentName: activity.agentName,
                  actionType: activity.actionType,
                  description: activity.description,
                  timestamp: new Date(activity.timestamp as string | Date),
                  status: activity.status,
                })
              }
              
              const activityEvent = `event: activity\ndata: ${JSON.stringify({
                activities,
                timestamp: new Date().toISOString(),
                source: "database",
              })}\n\n`
              controller.enqueue(encoder.encode(activityEvent))
            }
          }
        } catch (error) {
          console.error("Error fetching activity:", error)
        }
      }, 5000)
      
      // Clean up on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval)
        clearInterval(activityInterval)
        clients.delete(clientId)
        try {
          controller.close()
        } catch {
          // Controller might already be closed
        }
      })
    },
  })
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  })
}

// Broadcast function to send events to all connected clients
export async function broadcastAgentActivity(activity: {
  agentId: string
  agentName: string
  agentPersona: string
  actionType: string
  description: string
  status: string
  confidence: number
  propertyId?: string
}) {
  const encoder = new TextEncoder()
  const activityWithId = {
    ...activity,
    id: `broadcast-${Date.now()}`,
    timestamp: new Date().toISOString(),
  }
  
  // Cache the activity in Redis for persistence
  await pushAgentActivity(activity.propertyId || "all", {
    id: activityWithId.id,
    agentId: activity.agentId,
    agentName: activity.agentName,
    actionType: activity.actionType,
    description: activity.description,
    timestamp: new Date(),
    status: activity.status,
  })
  
  const event = `event: activity\ndata: ${JSON.stringify({
    activities: [activityWithId],
    timestamp: new Date().toISOString(),
  })}\n\n`
  
  clients.forEach((controller, clientId) => {
    try {
      controller.enqueue(encoder.encode(event))
    } catch {
      clients.delete(clientId)
    }
  })
}

