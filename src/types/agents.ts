import { z } from "zod"

export type AgentType =
  | "operations_commander"
  | "tenant_relations"
  | "financial_analyst"
  | "maintenance_coordinator"
  | "space_optimizer"
  | "compliance_monitor"

export interface AgentConfig {
  id: string
  name: string
  type: AgentType
  model: string
  systemPrompt: string
  tools: Tool[]
  settings: AgentSettings
}

export interface AgentSettings {
  temperature: number
  maxTokens: number
  confidenceThreshold: number
  requiresApprovalActions: string[]
  maxToolCalls: number
}

export interface AgentContext {
  propertyId: string
  userId?: string
  triggerType: TriggerType
  triggerData: Record<string, unknown>
  conversationHistory?: Message[]
  metadata?: Record<string, unknown>
}

export type TriggerType =
  | "chat_message"
  | "scheduled"
  | "event"
  | "api_call"
  | "manual"

export interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface AgentDecision {
  id: string
  agentId: string
  action: string
  reasoning: string
  confidence: number
  requiresApproval: boolean
  data: Record<string, unknown>
  alternatives: Alternative[]
  metadata: {
    toolCalls: ToolCall[]
    tokensUsed: number
    latencyMs: number
  }
}

export interface Alternative {
  action: string
  reasoning: string
  confidence: number
}

export interface ToolCall {
  name: string
  input: Record<string, unknown>
  output: unknown
  success: boolean
  latencyMs: number
}

export interface Tool {
  name: string
  description: string
  parameters: z.ZodObject<z.ZodRawShape>
  handler: (params: unknown, context: AgentContext) => Promise<ToolResult>
}

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
}

export interface AgentAction {
  id: string
  agentId: string
  agentType: AgentType
  agentName: string
  actionType: string
  entityType?: string
  entityId?: string
  trigger: string
  reasoning: string
  confidence: number
  status: "pending" | "approved" | "executed" | "rejected" | "failed"
  requiresApproval: boolean
  approvedBy?: string
  approvedAt?: Date
  executedAt?: Date
  result?: Record<string, unknown>
  error?: string
  createdAt: Date
}

export const AGENT_INFO: Record<AgentType, { name: string; color: string; bgClass: string }> = {
  operations_commander: {
    name: "Operations Commander",
    color: "#3B82F6",
    bgClass: "bg-blue-100 text-blue-700",
  },
  tenant_relations: {
    name: "Tenant Relations",
    color: "#22C55E",
    bgClass: "bg-green-100 text-green-700",
  },
  financial_analyst: {
    name: "Financial Analyst",
    color: "#A855F7",
    bgClass: "bg-purple-100 text-purple-700",
  },
  maintenance_coordinator: {
    name: "Maintenance Coordinator",
    color: "#F97316",
    bgClass: "bg-orange-100 text-orange-700",
  },
  space_optimizer: {
    name: "Space Optimizer",
    color: "#EC4899",
    bgClass: "bg-pink-100 text-pink-700",
  },
  compliance_monitor: {
    name: "Compliance Monitor",
    color: "#EF4444",
    bgClass: "bg-red-100 text-red-700",
  },
}

