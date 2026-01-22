"use client"

import * as React from "react"
import { KPICard } from "./kpi-card"
import { AgentActivityFeed } from "@/components/agents/agent-activity-feed"
import { AnomalyAlerts } from "./anomaly-alerts"
import { QuickActions } from "./quick-actions"
import {
  Building2,
  CreditCard,
  Wrench,
  ThumbsUp,
  TrendingUp,
  TrendingDown,
  Bot,
  AlertTriangle,
} from "lucide-react"

// Mock data - will be replaced with real API calls
const mockKPIs = {
  occupancy: {
    value: 94.5,
    change: 2.3,
    trend: "up" as const,
    label: "Occupancy Rate",
    suffix: "%",
    icon: Building2,
  },
  collection: {
    value: 87.2,
    change: -1.5,
    trend: "down" as const,
    label: "Collection Rate",
    suffix: "%",
    icon: CreditCard,
  },
  workOrders: {
    value: 12,
    change: 3,
    trend: "up" as const,
    label: "Active Work Orders",
    suffix: "",
    icon: Wrench,
  },
  satisfaction: {
    value: 4.2,
    change: 0.3,
    trend: "up" as const,
    label: "Tenant Satisfaction",
    suffix: "/5",
    icon: ThumbsUp,
  },
}

export function CommandCenter() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">
            AI-powered operations hub for Metro Mall
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-green-50 px-3 py-1.5 text-green-700">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm font-medium">All agents operational</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label={mockKPIs.occupancy.label}
          value={mockKPIs.occupancy.value}
          suffix={mockKPIs.occupancy.suffix}
          change={mockKPIs.occupancy.change}
          trend={mockKPIs.occupancy.trend}
          icon={mockKPIs.occupancy.icon}
        />
        <KPICard
          label={mockKPIs.collection.label}
          value={mockKPIs.collection.value}
          suffix={mockKPIs.collection.suffix}
          change={mockKPIs.collection.change}
          trend={mockKPIs.collection.trend}
          icon={mockKPIs.collection.icon}
        />
        <KPICard
          label={mockKPIs.workOrders.label}
          value={mockKPIs.workOrders.value}
          suffix={mockKPIs.workOrders.suffix}
          change={mockKPIs.workOrders.change}
          trend={mockKPIs.workOrders.trend}
          icon={mockKPIs.workOrders.icon}
        />
        <KPICard
          label={mockKPIs.satisfaction.label}
          value={mockKPIs.satisfaction.value}
          suffix={mockKPIs.satisfaction.suffix}
          change={mockKPIs.satisfaction.change}
          trend={mockKPIs.satisfaction.trend}
          icon={mockKPIs.satisfaction.icon}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Agent Activity Feed - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AgentActivityFeed />
        </div>

        {/* Right Column - Alerts and Quick Actions */}
        <div className="space-y-6">
          <AnomalyAlerts />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}

