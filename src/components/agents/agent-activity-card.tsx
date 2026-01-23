"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ConfidenceMeter } from "./confidence-meter"
import {
  Bot,
  Check,
  X,
  ChevronRight,
  FileText,
  Wrench,
  CreditCard,
  AlertTriangle,
  Building2,
  Shield,
} from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import type { AgentAction, AgentType } from "@/types/agents"
import { AGENT_INFO } from "@/types/agents"

interface AgentActivityCardProps {
  action: AgentAction
  onApprove?: (actionId: string) => void
  onReject?: (actionId: string) => void
}

const getActionIcon = (actionType: string) => {
  const icons: Record<string, React.ReactNode> = {
    work_order_created: <Wrench className="h-4 w-4" />,
    payment_reminder_sent: <CreditCard className="h-4 w-4" />,
    preventive_maintenance_scheduled: <Wrench className="h-4 w-4" />,
    anomaly_detected: <AlertTriangle className="h-4 w-4" />,
    lease_recommendation: <Building2 className="h-4 w-4" />,
    compliance_alert: <Shield className="h-4 w-4" />,
  }
  return icons[actionType] || <FileText className="h-4 w-4" />
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
    pending: "warning",
    approved: "success",
    executed: "success",
    rejected: "destructive",
    failed: "destructive",
  }
  return (
    <Badge variant={variants[status] || "secondary"} className="text-[10px]">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

const formatActionType = (actionType: string) => {
  return actionType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function AgentActivityCard({
  action,
  onApprove,
  onReject,
}: AgentActivityCardProps) {
  const agentInfo = AGENT_INFO[action.agentType]
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
    <Card
      className={cn(
        "p-4 transition-all",
        action.status === "pending" && "border-yellow-200 bg-yellow-50/30"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Agent Avatar */}
        <Avatar className={cn("h-10 w-10", agentInfo.bgClass)}>
          <AvatarFallback className={agentInfo.bgClass}>
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{agentInfo.name}</span>
                <Badge variant="outline" className="text-[10px] gap-1">
                  {getActionIcon(action.actionType)}
                  {formatActionType(action.actionType)}
                </Badge>
                {getStatusBadge(action.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                Triggered by: {action.trigger}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ConfidenceMeter confidence={action.confidence} />
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(action.createdAt)}
              </span>
            </div>
          </div>

          {/* Reasoning */}
          <p className={cn(
            "text-sm text-muted-foreground",
            !isExpanded && "line-clamp-2"
          )}>
            {action.reasoning}
          </p>

          {action.reasoning.length > 150 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show less" : "Show more"}
            </Button>
          )}

          {/* Actions */}
          {action.requiresApproval && action.status === "pending" && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => onApprove?.(action.id)}
                className="h-8 gap-1"
              >
                <Check className="h-3 w-3" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject?.(action.id)}
                className="h-8 gap-1"
              >
                <X className="h-3 w-3" />
                Reject
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 ml-auto"
                onClick={() => {
                  // Navigate to the approvals page for details
                  window.location.href = "/approvals"
                }}
              >
                View Details
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Executed actions - show result */}
          {action.status === "executed" && action.entityType && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 p-0 text-xs"
              onClick={() => {
                // Navigate to the appropriate page based on entity type
                const routes: Record<string, string> = {
                  work_order: "/work-orders",
                  invoice: "/financials",
                  equipment: "/equipment",
                  metrics: "/analytics",
                  lease: "/tenants",
                }
                const entityType = action.entityType || "unknown"
                window.location.href = routes[entityType] || "/dashboard"
              }}
            >
              View {(action.entityType || "entity").replace("_", " ")}
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

