"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  BarChart3,
  Store,
  Receipt,
  Activity,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { usePropertyStore } from "@/stores/property-store"
import { useToast } from "@/components/ui/use-toast"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface TenantRevenue {
  id: string
  name: string
  category: string
  unit: string
  floor: string
  revSharePercentage: number
  posProvider: string | null
  posStatus: string
  grossSales: number
  totalTransactions: number
  avgDailySales: number
  revenueShareDue: number
  trend: number
  anomalyFlag: string | null
}

interface Anomaly {
  tenantId: string
  tenantName: string
  unit: string
  type: string
  description: string
  severity: string
  recommendation: string
  currentAvgDaily: number
}

interface NotConnectedTenant {
  id: string
  name: string
  category: string
  unit: string
  floor: string
  revSharePercentage: number
  leaseId?: string
  propertyId?: string
}

interface DailyChartData {
  date: string
  grossSales: number
  transactions: number
}

interface RevenueData {
  stats: {
    totalPOSRevenue: number
    prevPeriodRevenue: number
    revenueTrend: number
    revenueShareDue: number
    connectedStores: number
    totalRevShareTenants: number
    notConnectedCount: number
    lastSyncAt: string | null
  }
  tenants: TenantRevenue[]
  notConnected: NotConnectedTenant[]
  dailyChart: DailyChartData[]
  anomalies: Anomaly[]
  period: { start: string; end: string; days: number }
}

const PROVIDER_ICONS: Record<string, string> = {
  pine_labs: "\u{1F332}",
  razorpay_pos: "\u26A1",
  petpooja: "\u{1F37D}\uFE0F",
  posist: "\u{1F3EA}",
  shopify: "\u{1F6CD}\uFE0F",
  square: "\u{1F7E6}",
  lightspeed: "\u{1F4A1}",
  vend: "\u{1F3F7}\uFE0F",
}

const PROVIDER_NAMES: Record<string, string> = {
  pine_labs: "Pine Labs",
  razorpay_pos: "Razorpay POS",
  petpooja: "Petpooja",
  posist: "POSist",
  shopify: "Shopify POS",
  square: "Square",
  lightspeed: "Lightspeed",
  vend: "Vend",
}

const PROVIDER_STORE_HINTS: Record<string, string> = {
  pine_labs: "e.g., PL-MUM-4821",
  razorpay_pos: "e.g., rzp_store_Kx9n2Bq",
  petpooja: "e.g., PP78234",
  posist: "e.g., PST-DEL-0091",
  shopify: "e.g., my-store-name",
  square: "e.g., sq_loc_ABC123",
  lightspeed: "e.g., LS482910",
  vend: "e.g., mystore",
}

/** Format a timestamp as relative time */
function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays === 1) return `Yesterday at ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function RevenueIntelligencePage() {
  const [data, setData] = React.useState<RevenueData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [syncing, setSyncing] = React.useState(false)
  const [period, setPeriod] = React.useState("30")
  const { selectedProperty } = usePropertyStore()
  const selectedPropertyId = selectedProperty?.id || null
  const { toast } = useToast()

  // Connect POS dialog state
  const [connectDialogOpen, setConnectDialogOpen] = React.useState(false)
  const [connectingTenant, setConnectingTenant] = React.useState<NotConnectedTenant | null>(null)
  const [connectForm, setConnectForm] = React.useState({
    provider: "",
    storeId: "",
    apiKey: "",
    syncFrequency: "daily",
  })
  const [connectTestStatus, setConnectTestStatus] = React.useState<"idle" | "testing" | "success" | "error">("idle")
  const [connectTestMessage, setConnectTestMessage] = React.useState("")
  const [isConnecting, setIsConnecting] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      if (selectedPropertyId) params.set("propertyId", selectedPropertyId)
      const res = await fetch(`/api/revenue-intelligence?${params}`)
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch revenue intelligence:", error)
    } finally {
      setLoading(false)
    }
  }, [period, selectedPropertyId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // REAL Sync All — calls /api/pos/sync-all
  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/pos/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: parseInt(period) }),
      })
      const result = await res.json()
      if (result.success) {
        toast({
          title: "POS Sync Complete",
          description: result.data.message,
        })
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync POS data",
          variant: "destructive",
        })
      }
      await fetchData()
    } catch (error) {
      console.error("Sync all error:", error)
      toast({
        title: "Sync Error",
        description: "Network error — please try again.",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  // Open Connect POS dialog for a tenant
  const openConnectDialog = (tenant: NotConnectedTenant) => {
    setConnectingTenant(tenant)
    setConnectForm({ provider: "", storeId: "", apiKey: "", syncFrequency: "daily" })
    setConnectTestStatus("idle")
    setConnectTestMessage("")
    setConnectDialogOpen(true)
  }

  // Test POS connection from the dialog
  const handleTestConnection = async () => {
    if (!connectForm.provider || !connectForm.storeId || !connectForm.apiKey) {
      setConnectTestStatus("error")
      setConnectTestMessage("Please fill in all fields: provider, store ID, and API key.")
      return
    }
    setConnectTestStatus("testing")
    setConnectTestMessage("")
    try {
      const res = await fetch("/api/pos/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: connectForm.provider,
          storeId: connectForm.storeId,
          apiKey: connectForm.apiKey,
        }),
      })
      const result = await res.json()
      if (result.success) {
        setConnectTestStatus("success")
        setConnectTestMessage(result.data?.message || "Connection verified successfully.")
      } else {
        setConnectTestStatus("error")
        setConnectTestMessage(result.data?.message || result.error || "Connection failed.")
      }
    } catch {
      setConnectTestStatus("error")
      setConnectTestMessage("Network error — unable to reach the server.")
    }
  }

  // Connect & Sync — saves integration + triggers 90-day sync
  const handleConnectAndSync = async () => {
    if (!connectingTenant || connectTestStatus !== "success") return
    setIsConnecting(true)
    try {
      // Step 1: Create POS integration
      const connectRes = await fetch("/api/pos/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: connectingTenant.id,
          propertyId: connectingTenant.propertyId,
          leaseId: connectingTenant.leaseId,
          provider: connectForm.provider,
          storeId: connectForm.storeId,
          apiKey: connectForm.apiKey,
          syncFrequency: connectForm.syncFrequency,
        }),
      })
      const connectResult = await connectRes.json()

      if (!connectResult.success) {
        toast({
          title: "Connection Failed",
          description: connectResult.error || "Failed to save POS integration.",
          variant: "destructive",
        })
        setIsConnecting(false)
        return
      }

      // Integration created — sales data will come from POS Simulator
      // (no auto-sync of mock data)

      toast({
        title: "POS Connected",
        description: `${connectingTenant.name} is now connected via ${PROVIDER_NAMES[connectForm.provider] || connectForm.provider}. Use the POS Simulator to enter sales.`,
      })

      setConnectDialogOpen(false)
      setConnectingTenant(null)
      await fetchData()
    } catch (error) {
      console.error("Connect and sync error:", error)
      toast({
        title: "Error",
        description: "Failed to connect POS. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  const { stats, tenants, notConnected, dailyChart, anomalies } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Real-time POS data from {stats.connectedStores} connected stores &middot; {data.period.days}-day view
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSyncAll} disabled={syncing} variant="outline" type="button">
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync All POS
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total POS Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPOSRevenue)}</div>
            <div className="flex items-center text-xs mt-1">
              {stats.revenueTrend >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={stats.revenueTrend >= 0 ? "text-emerald-500" : "text-red-500"}>
                {Math.abs(stats.revenueTrend)}%
              </span>
              <span className="text-muted-foreground ml-1">vs prev period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Share Due</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenueShareDue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Calculated from POS data &times; lease terms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + t.totalTransactions, 0).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all connected stores this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Stores</CardTitle>
            <Wifi className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.connectedStores}
              <span className="text-sm font-normal text-muted-foreground"> / {stats.totalRevShareTenants}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.notConnectedCount > 0 ? `${stats.notConnectedCount} pending connection` : "All stores connected"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Revenue Anomalies Detected
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {anomalies.map((anomaly) => (
              <Card key={anomaly.tenantId} className="border-amber-200 bg-amber-50/30">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{anomaly.tenantName}</span>
                        <Badge variant="outline" className="text-xs">
                          {anomaly.unit}
                        </Badge>
                        <Badge className={anomaly.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                          {anomaly.severity === "high" ? "High Risk" : "Medium Risk"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                      <div className="flex items-center gap-4 text-xs mt-2">
                        <span className="text-muted-foreground">
                          Avg Daily: <strong>{formatCurrency(anomaly.currentAvgDaily)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-white rounded text-xs text-muted-foreground border">
                    <strong>Recommendation:</strong> {anomaly.recommendation}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sales Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sales Overview
          </CardTitle>
          <CardDescription>
            Aggregated daily POS revenue across all connected stores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChart}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val: string) => {
                    const d = new Date(val)
                    return `${d.getDate()}/${d.getMonth() + 1}`
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val: number) => `\u20B9${(val / 100000).toFixed(1)}L`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Gross Sales"]}
                  labelFormatter={(label: string) => {
                    const d = new Date(label)
                    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="grossSales"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Share Calculation Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Revenue Share Breakdown
              </CardTitle>
              <CardDescription>
                POS-verified revenue share calculations for each tenant
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" /> Live POS Data
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>POS Provider</TableHead>
                <TableHead className="text-right">Gross Sales (POS)</TableHead>
                <TableHead className="text-center">Rev Share %</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  className={tenant.anomalyFlag ? "bg-amber-50/50" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {tenant.category.replace("_", " ")}
                        </div>
                      </div>
                      {tenant.anomalyFlag && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{tenant.unit}</span>
                    <div className="text-xs text-muted-foreground">{tenant.floor}</div>
                  </TableCell>
                  <TableCell>
                    {tenant.posProvider ? (
                      <div className="flex items-center gap-1.5">
                        <span>{PROVIDER_ICONS[tenant.posProvider] || "\u{1F4E1}"}</span>
                        <span className="text-sm">{PROVIDER_NAMES[tenant.posProvider] || tenant.posProvider}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not connected</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(tenant.grossSales)}
                    <div className="flex items-center justify-end text-xs mt-0.5">
                      {tenant.trend >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={tenant.trend >= 0 ? "text-emerald-500" : "text-red-500"}>
                        {Math.abs(tenant.trend)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{tenant.revSharePercentage}%</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    {formatCurrency(tenant.revenueShareDue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {tenant.totalTransactions.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-center">
                    {tenant.posStatus === "connected" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <Wifi className="h-3 w-3 mr-1" /> Live
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <WifiOff className="h-3 w-3 mr-1" /> Offline
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={3}>
                  Total ({tenants.length} tenants)
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(stats.totalPOSRevenue)}
                </TableCell>
                <TableCell />
                <TableCell className="text-right text-emerald-600">
                  {formatCurrency(stats.revenueShareDue)}
                </TableCell>
                <TableCell className="text-right">
                  {tenants.reduce((sum, t) => sum + t.totalTransactions, 0).toLocaleString("en-IN")}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Not Connected Tenants */}
      {notConnected.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <WifiOff className="h-5 w-5" />
              Pending POS Connection ({notConnected.length})
            </CardTitle>
            <CardDescription>
              Revenue-share tenants without POS integration &mdash; connect to start tracking actual sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {notConnected.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div>
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tenant.unit} &middot; {tenant.floor} Floor &middot; {tenant.revSharePercentage}% rev share
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openConnectDialog(tenant)}
                  >
                    <Store className="h-4 w-4 mr-1" /> Connect POS
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Last Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.lastSyncAt ? formatRelativeTime(stats.lastSyncAt) : "Never synced"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.lastSyncAt
                ? `Last synced: ${new Date(stats.lastSyncAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
                : "Click 'Sync All POS' to pull latest data"
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Store className="h-4 w-4" /> Avg Daily per Store
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {tenants.length > 0
                ? formatCurrency(tenants.reduce((sum, t) => sum + t.avgDailySales, 0) / tenants.length)
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Average daily sales per connected store</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IndianRupee className="h-4 w-4" /> Avg Daily Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.totalPOSRevenue / (data.period.days || 1))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Average across {data.period.days} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Connect POS Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Connect POS System
            </DialogTitle>
            <DialogDescription>
              {connectingTenant && (
                <>
                  Connect POS for <strong>{connectingTenant.name}</strong> ({connectingTenant.unit}, {connectingTenant.revSharePercentage}% revenue share)
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Provider Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">POS Provider</label>
              <Select
                value={connectForm.provider}
                onValueChange={(v) => {
                  setConnectForm({ ...connectForm, provider: v, storeId: "", apiKey: "" })
                  setConnectTestStatus("idle")
                  setConnectTestMessage("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select POS system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pine_labs">{PROVIDER_ICONS.pine_labs} Pine Labs</SelectItem>
                  <SelectItem value="razorpay_pos">{PROVIDER_ICONS.razorpay_pos} Razorpay POS</SelectItem>
                  <SelectItem value="petpooja">{PROVIDER_ICONS.petpooja} Petpooja</SelectItem>
                  <SelectItem value="posist">{PROVIDER_ICONS.posist} POSist</SelectItem>
                  <SelectItem value="shopify">{PROVIDER_ICONS.shopify} Shopify POS</SelectItem>
                  <SelectItem value="square">{PROVIDER_ICONS.square} Square</SelectItem>
                  <SelectItem value="lightspeed">{PROVIDER_ICONS.lightspeed} Lightspeed</SelectItem>
                  <SelectItem value="vend">{PROVIDER_ICONS.vend} Vend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Store ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Store ID / Location ID</label>
              <Input
                value={connectForm.storeId}
                onChange={(e) => {
                  setConnectForm({ ...connectForm, storeId: e.target.value })
                  setConnectTestStatus("idle")
                }}
                placeholder={connectForm.provider ? (PROVIDER_STORE_HINTS[connectForm.provider] || "Enter store ID") : "Select a provider first"}
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key / Access Token</label>
              <Input
                type="password"
                value={connectForm.apiKey}
                onChange={(e) => {
                  setConnectForm({ ...connectForm, apiKey: e.target.value })
                  setConnectTestStatus("idle")
                }}
                placeholder="Enter API key (min 16 characters)"
              />
            </div>

            {/* Sync Frequency */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sync Frequency</label>
              <Select value={connectForm.syncFrequency} onValueChange={(v) => setConnectForm({ ...connectForm, syncFrequency: v })}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real_time">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Test Connection Button + Status */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={connectTestStatus === "testing" || !connectForm.provider || !connectForm.storeId || !connectForm.apiKey}
                className="gap-2"
              >
                {connectTestStatus === "testing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : connectTestStatus === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : connectTestStatus === "error" ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Wifi className="h-4 w-4" />
                )}
                Test Connection
              </Button>
              {connectTestMessage && (
                <p className={`text-xs flex-1 ${connectTestStatus === "success" ? "text-emerald-600" : "text-red-600"}`}>
                  {connectTestMessage}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setConnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConnectAndSync}
              disabled={connectTestStatus !== "success" || isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wifi className="h-4 w-4 mr-2" />
              )}
              {isConnecting ? "Connecting & Syncing..." : "Connect & Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
