"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  DollarSign,
  Building2,
  Footprints,
  Target,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

function EmptyChartState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center text-center">
      <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
      <p className="mt-4 text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 max-w-[250px] text-xs text-muted-foreground/70">{description}</p>
    </div>
  )
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  subtitle,
}: {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ElementType
  subtitle?: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <Icon className="h-6 w-6" />
          </div>
          <Badge
            variant={trend === "up" ? "success" : trend === "down" ? "destructive" : "secondary"}
            className="gap-1"
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {change}
          </Badge>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState("6m")
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights across your properties
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value="--"
          change="--"
          trend="neutral"
          icon={DollarSign}
          subtitle="No data yet"
        />
        <MetricCard
          title="Occupancy Rate"
          value="--"
          change="--"
          trend="neutral"
          icon={Building2}
          subtitle="No data yet"
        />
        <MetricCard
          title="Foot Traffic"
          value="--"
          change="--"
          trend="neutral"
          icon={Footprints}
          subtitle="No data yet"
        />
        <MetricCard
          title="Collection Rate"
          value="--"
          change="--"
          trend="neutral"
          icon={Target}
          subtitle="No data yet"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue, expenses, and profit</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyChartState
              title="No revenue data yet"
              description="Connect tenants and POS systems to see revenue trends here"
            />
          </CardContent>
        </Card>

        {/* Occupancy Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Trend</CardTitle>
            <CardDescription>Actual vs target occupancy rate</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyChartState
              title="No occupancy data yet"
              description="Add properties and leases to track occupancy over time"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Foot Traffic */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Foot Traffic</CardTitle>
            <CardDescription>Daily visitor count compared to last week</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyChartState
              title="No foot traffic data yet"
              description="Integrate foot traffic sensors or POS systems to track visitor counts"
            />
          </CardContent>
        </Card>

        {/* Tenant Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Categories</CardTitle>
            <CardDescription>Distribution by business type</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyChartState
              title="No tenant data yet"
              description="Add tenants and assign categories to see distribution"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Work Order Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Analytics</CardTitle>
            <CardDescription>Work order status by category</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyChartState
              title="No maintenance data yet"
              description="Create work orders to see maintenance analytics by category"
            />
          </CardContent>
        </Card>

        {/* AI Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle>AI Agent Performance</CardTitle>
            <CardDescription>Agent actions and success rates</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyChartState
              title="No agent activity yet"
              description="AI agents will show performance metrics once they begin processing tasks"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

