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
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  DollarSign,
  Users,
  Building2,
  Footprints,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Revenue trend data
const revenueData = [
  { month: "Aug", revenue: 3800000, expenses: 1200000, profit: 2600000 },
  { month: "Sep", revenue: 4100000, expenses: 1250000, profit: 2850000 },
  { month: "Oct", revenue: 4350000, expenses: 1300000, profit: 3050000 },
  { month: "Nov", revenue: 4200000, expenses: 1280000, profit: 2920000 },
  { month: "Dec", revenue: 5100000, expenses: 1450000, profit: 3650000 },
  { month: "Jan", revenue: 4500000, expenses: 1350000, profit: 3150000 },
]

// Occupancy trend data
const occupancyData = [
  { month: "Aug", occupancy: 89, target: 90 },
  { month: "Sep", occupancy: 91, target: 90 },
  { month: "Oct", occupancy: 92, target: 90 },
  { month: "Nov", occupancy: 93, target: 92 },
  { month: "Dec", occupancy: 94, target: 92 },
  { month: "Jan", occupancy: 94.2, target: 92 },
]

// Foot traffic data
const footTrafficData = [
  { day: "Mon", traffic: 8500, lastWeek: 8200 },
  { day: "Tue", traffic: 9200, lastWeek: 8800 },
  { day: "Wed", traffic: 9800, lastWeek: 9500 },
  { day: "Thu", traffic: 10200, lastWeek: 9800 },
  { day: "Fri", traffic: 12500, lastWeek: 12000 },
  { day: "Sat", traffic: 15000, lastWeek: 14500 },
  { day: "Sun", traffic: 14200, lastWeek: 13800 },
]

// Tenant category distribution
const tenantCategoryData = [
  { name: "Fashion & Apparel", value: 35, color: "#10b981" },
  { name: "Food & Beverage", value: 25, color: "#f59e0b" },
  { name: "Electronics", value: 15, color: "#3b82f6" },
  { name: "Entertainment", value: 12, color: "#8b5cf6" },
  { name: "Health & Beauty", value: 8, color: "#ec4899" },
  { name: "Services", value: 5, color: "#6b7280" },
]

// Work order analytics
const workOrderData = [
  { category: "HVAC", open: 5, resolved: 23, avgTime: 4.2 },
  { category: "Plumbing", open: 3, resolved: 18, avgTime: 2.8 },
  { category: "Electrical", open: 2, resolved: 15, avgTime: 3.5 },
  { category: "Cleaning", open: 8, resolved: 45, avgTime: 1.2 },
  { category: "Security", open: 1, resolved: 12, avgTime: 0.8 },
]

// Agent performance data
const agentPerformanceData = [
  { agent: "Tenant Relations", actions: 156, success: 94, confidence: 0.91 },
  { agent: "Operations", actions: 89, success: 91, confidence: 0.88 },
  { agent: "Financial", actions: 124, success: 96, confidence: 0.93 },
  { agent: "Maintenance", actions: 78, success: 89, confidence: 0.85 },
]

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
          value="₹45.0L"
          change="+12.5%"
          trend="up"
          icon={DollarSign}
          subtitle="This month"
        />
        <MetricCard
          title="Occupancy Rate"
          value="94.2%"
          change="+2.3%"
          trend="up"
          icon={Building2}
          subtitle="vs target: 92%"
        />
        <MetricCard
          title="Foot Traffic"
          value="79.4K"
          change="+8.2%"
          trend="up"
          icon={Footprints}
          subtitle="This week"
        />
        <MetricCard
          title="Collection Rate"
          value="97.5%"
          change="+1.2%"
          trend="up"
          icon={Target}
          subtitle="vs last month"
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
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`₹${(value / 100000).toFixed(2)}L`, ""]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#3b82f6"
                  fill="url(#colorProfit)"
                  strokeWidth={2}
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Occupancy Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Trend</CardTitle>
            <CardDescription>Actual vs target occupancy rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  domain={[85, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={footTrafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [value.toLocaleString(), ""]}
                />
                <Legend />
                <Bar
                  dataKey="traffic"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="This Week"
                />
                <Bar
                  dataKey="lastWeek"
                  fill="#e5e7eb"
                  radius={[4, 4, 0, 0]}
                  name="Last Week"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tenant Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Categories</CardTitle>
            <CardDescription>Distribution by business type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tenantCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {tenantCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {tenantCategoryData.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workOrderData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="#9ca3af"
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="resolved"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  name="Resolved"
                />
                <Bar
                  dataKey="open"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                  name="Open"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle>AI Agent Performance</CardTitle>
            <CardDescription>Agent actions and success rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {agentPerformanceData.map((agent) => (
                <div key={agent.agent} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium">{agent.agent}</span>
                    </div>
                    <Badge variant="outline">{agent.actions} actions</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Success Rate</span>
                        <span className="font-medium">{agent.success}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${agent.success}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Confidence</div>
                      <div className="font-medium">{(agent.confidence * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

