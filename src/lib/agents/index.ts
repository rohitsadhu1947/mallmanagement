// Agent Implementations
export { tenantRelationsAgent, TenantRelationsAgent } from "./implementations/tenant-relations"
export { operationsCommanderAgent, OperationsCommanderAgent } from "./implementations/operations"
export { financialAnalystAgent, FinancialAnalystAgent } from "./implementations/financial"
export { maintenanceCoordinatorAgent, MaintenanceCoordinatorAgent } from "./implementations/maintenance"
export { spaceOptimizationAgent, SpaceOptimizationAgent } from "./implementations/space-optimization"
export { complianceMonitorAgent, ComplianceMonitorAgent } from "./implementations/compliance"

// Agent Tools
export { tenantRelationsTools } from "./tools/tenant-relations"
export { operationsTools } from "./tools/operations"
export { financialTools } from "./tools/financial"
export { maintenanceTools } from "./tools/maintenance"
export { spaceOptimizationTools } from "./tools/space-optimization"
export { complianceTools } from "./tools/compliance"

// Agent Prompts
export { TENANT_RELATIONS_SYSTEM_PROMPT } from "./prompts/tenant-relations"
export { OPERATIONS_COMMANDER_SYSTEM_PROMPT } from "./prompts/operations"
export { FINANCIAL_ANALYST_SYSTEM_PROMPT } from "./prompts/financial"
export { MAINTENANCE_COORDINATOR_SYSTEM_PROMPT } from "./prompts/maintenance"
export { SPACE_OPTIMIZATION_SYSTEM_PROMPT } from "./prompts/space-optimization"
export { COMPLIANCE_MONITOR_SYSTEM_PROMPT } from "./prompts/compliance"

// Orchestrator
export { BaseAgent, AgentOrchestrator, createOrchestrator } from "./orchestrator"

// Types
export type {
  AgentConfig,
  AgentContext,
  AgentMessage,
  AgentResponse,
  AgentPersona,
  Tool,
  ToolResult,
  AgentAction,
} from "@/types/agents"

// Agent Registry
import { tenantRelationsAgent } from "./implementations/tenant-relations"
import { operationsCommanderAgent } from "./implementations/operations"
import { financialAnalystAgent } from "./implementations/financial"
import { maintenanceCoordinatorAgent } from "./implementations/maintenance"
import { spaceOptimizationAgent } from "./implementations/space-optimization"
import { complianceMonitorAgent } from "./implementations/compliance"
import type { BaseAgent } from "./orchestrator"

export const agentRegistry: Record<string, BaseAgent> = {
  "tenant-relations": tenantRelationsAgent,
  "operations-commander": operationsCommanderAgent,
  "financial-analyst": financialAnalystAgent,
  "maintenance-coordinator": maintenanceCoordinatorAgent,
  "space-optimizer": spaceOptimizationAgent,
  "compliance-monitor": complianceMonitorAgent,
}

export function getAgent(agentId: string): BaseAgent | undefined {
  return agentRegistry[agentId]
}

export function getAllAgents(): BaseAgent[] {
  return Object.values(agentRegistry)
}

export const agentMetadata = [
  {
    id: "tenant-relations",
    name: "Tenant Relations Manager",
    persona: "tenant_relations",
    description: "Handles tenant communications, requests, and relationship management",
    color: "#10b981",
    icon: "Users",
  },
  {
    id: "operations-commander",
    name: "Operations Commander",
    persona: "operations_commander",
    description: "Oversees daily operations, monitors KPIs, and detects anomalies",
    color: "#3b82f6",
    icon: "Activity",
  },
  {
    id: "financial-analyst",
    name: "Financial Analyst",
    persona: "financial_analyst",
    description: "Analyzes financial data, predicts payments, and manages collections",
    color: "#f59e0b",
    icon: "DollarSign",
  },
  {
    id: "maintenance-coordinator",
    name: "Maintenance Coordinator",
    persona: "maintenance_coordinator",
    description: "Manages work orders, vendors, and preventive maintenance",
    color: "#ef4444",
    icon: "Wrench",
  },
  {
    id: "space-optimizer",
    name: "Space Optimization Strategist",
    persona: "space_optimizer",
    description: "Analyzes tenant performance, optimizes space utilization, and recommends lease decisions",
    color: "#8b5cf6",
    icon: "LayoutGrid",
  },
  {
    id: "compliance-monitor",
    name: "Compliance Monitor",
    persona: "compliance_monitor",
    description: "Monitors regulatory compliance, tracks deadlines, and ensures documentation standards",
    color: "#64748b",
    icon: "Shield",
  },
]

