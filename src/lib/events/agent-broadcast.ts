import { pushAgentActivity } from "@/lib/cache"

// Store for active connections (shared module state)
export const clients = new Map<string, ReadableStreamDefaultController>()

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

