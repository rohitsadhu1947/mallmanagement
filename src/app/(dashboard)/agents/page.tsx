"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgentActivityFeed } from "@/components/agents/agent-activity-feed"
import {
  Bot,
  Activity,
  Users,
  DollarSign,
  Wrench,
  LayoutGrid,
  Shield,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AgentStats {
  id: string
  name: string
  type: string
  description: string
  status: "active" | "paused" | "training"
  icon: React.ReactNode
  color: string
  stats: {
    actionsToday: number
    pendingApprovals: number
    successRate: number
    avgConfidence: number
  }
}

const agentData: AgentStats[] = [
  {
    id: "operations-commander",
    name: "Operations Commander",
    type: "operations_commander",
    description: "Monitors operations, detects anomalies, coordinates agents",
    status: "active",
    icon: <Activity className="h-5 w-5" />,
    color: "bg-blue-500",
    stats: {
      actionsToday: 45,
      pendingApprovals: 2,
      successRate: 94.5,
      avgConfidence: 0.87,
    },
  },
  {
    id: "tenant-relations",
    name: "Tenant Relations Manager",
    type: "tenant_relations",
    description: "Handles tenant queries, processes requests, manages communications",
    status: "active",
    icon: <Users className="h-5 w-5" />,
    color: "bg-emerald-500",
    stats: {
      actionsToday: 127,
      pendingApprovals: 0,
      successRate: 92.3,
      avgConfidence: 0.89,
    },
  },
  {
    id: "financial-analyst",
    name: "Financial Analyst",
    type: "financial_analyst",
    description: "Predicts payments, manages collections, analyzes finances",
    status: "active",
    icon: <DollarSign className="h-5 w-5" />,
    color: "bg-amber-500",
    stats: {
      actionsToday: 38,
      pendingApprovals: 3,
      successRate: 91.2,
      avgConfidence: 0.85,
    },
  },
  {
    id: "maintenance-coordinator",
    name: "Maintenance Coordinator",
    type: "maintenance_coordinator",
    description: "Schedules maintenance, assigns vendors, predicts failures",
    status: "active",
    icon: <Wrench className="h-5 w-5" />,
    color: "bg-red-500",
    stats: {
      actionsToday: 23,
      pendingApprovals: 1,
      successRate: 88.7,
      avgConfidence: 0.78,
    },
  },
  {
    id: "space-optimizer",
    name: "Space Optimization Strategist",
    type: "space_optimizer",
    description: "Analyzes tenant mix, recommends lease decisions, optimizes revenue",
    status: "training",
    icon: <LayoutGrid className="h-5 w-5" />,
    color: "bg-purple-500",
    stats: {
      actionsToday: 0,
      pendingApprovals: 0,
      successRate: 0,
      avgConfidence: 0,
    },
  },
  {
    id: "compliance-monitor",
    name: "Compliance Monitor",
    type: "compliance_monitor",
    description: "Tracks regulatory requirements, monitors deadlines, ensures documentation",
    status: "training",
    icon: <Shield className="h-5 w-5" />,
    color: "bg-slate-500",
    stats: {
      actionsToday: 0,
      pendingApprovals: 0,
      successRate: 0,
      avgConfidence: 0,
    },
  },
]

function AgentCard({ agent }: { agent: AgentStats }) {
  const statusConfig = {
    active: { label: "Active", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
    paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700", icon: <Pause className="h-3 w-3" /> },
    training: { label: "Training", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> },
  }

  const status = statusConfig[agent.status]

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <div className={cn("absolute left-0 top-0 h-full w-1", agent.color)} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", agent.color)}>
              {agent.icon}
            </div>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{agent.description}</CardDescription>
            </div>
          </div>
          <Badge className={cn("gap-1", status.color)}>
            {status.icon}
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {agent.status === "active" ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Actions Today</p>
                <p className="text-2xl font-bold">{agent.stats.actionsToday}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">
                  {agent.stats.pendingApprovals > 0 ? (
                    <span className="text-amber-600">{agent.stats.pendingApprovals}</span>
                  ) : (
                    <span className="text-green-600">0</span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>{agent.stats.successRate}% success</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Bot className="h-4 w-4" />
                  <span>{(agent.stats.avgConfidence * 100).toFixed(0)}% avg confidence</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Clock className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Agent is being trained</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AgentsPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  
  const activeAgents = agentData.filter(a => a.status === "active")
  const totalActionsToday = activeAgents.reduce((sum, a) => sum + a.stats.actionsToday, 0)
  const totalPending = activeAgents.reduce((sum, a) => sum + a.stats.pendingApprovals, 0)
  const avgSuccessRate = activeAgents.reduce((sum, a) => sum + a.stats.successRate, 0) / activeAgents.length

  const handleRefresh = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">
            Monitor and manage autonomous AI agents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Agents</p>
              <p className="text-2xl font-bold">{activeAgents.length}/{agentData.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actions Today</p>
              <p className="text-2xl font-bold">{totalActionsToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold">{totalPending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Success Rate</p>
              <p className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Agents and Activity */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents" className="gap-2">
            <Bot className="h-4 w-4" />
            Agent Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Live Activity
            {totalPending > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-[10px]">
                {totalPending}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agentData.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <AgentActivityFeed />
        </TabsContent>
      </Tabs>
    </div>
  )
}

