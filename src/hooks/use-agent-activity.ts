"use client"

import { useEffect, useState, useCallback, useRef } from "react"

export interface AgentActivity {
  id: string
  agentId: string
  agentName: string
  agentPersona: string
  actionType: string
  description: string
  status: string
  confidence: number
  timestamp: string
}

interface UseAgentActivityOptions {
  propertyId?: string
  enabled?: boolean
  onActivity?: (activities: AgentActivity[]) => void
}

export function useAgentActivity(options: UseAgentActivityOptions = {}) {
  const { propertyId = "", enabled = true, onActivity } = options
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return

    try {
      const url = `/api/events/agent-activity${propertyId ? `?propertyId=${propertyId}` : ""}`
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.addEventListener("connected", (event) => {
        console.log("SSE connected:", JSON.parse(event.data))
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      })

      eventSource.addEventListener("heartbeat", () => {
        // Heartbeat received, connection is healthy
      })

      eventSource.addEventListener("activity", (event) => {
        try {
          const data = JSON.parse(event.data)
          setActivities((prev) => {
            // Add new activities, avoiding duplicates
            const newActivities = data.activities.filter(
              (a: AgentActivity) => !prev.some((p) => p.id === a.id)
            )
            const combined = [...newActivities, ...prev].slice(0, 50) // Keep last 50
            return combined
          })
          onActivity?.(data.activities)
        } catch (e) {
          console.error("Error parsing activity event:", e)
        }
      })

      eventSource.onerror = () => {
        console.error("SSE connection error")
        setIsConnected(false)
        setError("Connection lost")
        eventSource.close()
        eventSourceRef.current = null

        // Reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    } catch (e) {
      console.error("Error creating EventSource:", e)
      setError("Failed to connect")
    }
  }, [enabled, propertyId, onActivity])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  const clearActivities = useCallback(() => {
    setActivities([])
  }, [])

  return {
    activities,
    isConnected,
    error,
    clearActivities,
    reconnect: connect,
  }
}

