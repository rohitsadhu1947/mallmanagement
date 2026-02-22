"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Plus,
  Search,
  Building2,
  TrendingUp,
  Calendar,
  RefreshCw,
  Loader2,
  Eye,
  Pencil,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileSignature,
  IndianRupee,
  Wifi,
  WifiOff,
  Store,
  CheckCircle,
  Zap,
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { usePropertyStore } from "@/stores/property-store"
import { format, differenceInDays, addMonths } from "date-fns"

interface Lease {
  id: string
  unitNumber: string
  floor: string | null
  zone: string | null
  areaSqft: string
  leaseType: string
  baseRent: string | null
  revenueSharePercentage: string | null
  camCharges: string | null
  securityDeposit: string | null
  startDate: string
  endDate: string
  rentEscalationPercentage: string | null
  escalationFrequencyMonths: number | null
  lockInPeriodMonths: number | null
  noticePeriodMonths: number | null
  status: string | null
  tenant: {
    id: string
    businessName: string
    contactPerson: string | null
  } | null
  property: {
    id: string
    name: string
    code: string
  } | null
}

interface Tenant {
  id: string
  businessName: string
  contactPerson: string | null
}

interface Property {
  id: string
  name: string
  city: string
  code: string
}

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  active: { color: "bg-emerald-100 text-emerald-700", label: "Active", icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending", icon: <Clock className="h-3 w-3" /> },
  expired: { color: "bg-red-100 text-red-700", label: "Expired", icon: <XCircle className="h-3 w-3" /> },
  terminated: { color: "bg-gray-100 text-gray-700", label: "Terminated", icon: <XCircle className="h-3 w-3" /> },
  renewal_pending: { color: "bg-blue-100 text-blue-700", label: "Renewal Pending", icon: <RefreshCw className="h-3 w-3" /> },
}

const leaseTypeLabels: Record<string, string> = {
  fixed_rent: "Fixed Rent",
  revenue_share: "Revenue Share",
  hybrid: "Hybrid",
  minimum_guarantee: "Minimum Guarantee",
}

export default function LeasesPage() {
  const { toast } = useToast()
  const { selectedProperty } = usePropertyStore()
  const [leases, setLeases] = React.useState<Lease[]>([])
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [properties, setProperties] = React.useState<Property[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedLease, setSelectedLease] = React.useState<Lease | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false)

  // Form state
  const [leaseForm, setLeaseForm] = React.useState({
    tenantId: "",
    propertyId: "",
    unitNumber: "",
    floor: "",
    zone: "",
    areaSqft: "",
    leaseType: "fixed_rent",
    baseRent: "",
    revenueSharePercentage: "",
    camCharges: "",
    securityDeposit: "",
    startDate: "",
    endDate: "",
    escalationRate: "",
    escalationFrequency: "12",
    lockInPeriod: "",
    terminationNoticeDays: "90",
    fitOutPeriod: "",
    rentFreePeriod: "",
    // POS Integration fields (only for revenue_share & hybrid)
    posProvider: "",
    posStoreId: "",
    posApiKey: "",
    posSyncFrequency: "daily",
  })

  // POS connection test state
  const [posTestStatus, setPosTestStatus] = React.useState<"idle" | "testing" | "success" | "error">("idle")
  const [posTestMessage, setPosTestMessage] = React.useState("")

  const isRevShareLease = leaseForm.leaseType === "revenue_share" || leaseForm.leaseType === "hybrid" || leaseForm.leaseType === "minimum_guarantee"

  const handleTestPOSConnection = async () => {
    if (!leaseForm.posProvider || !leaseForm.posStoreId || !leaseForm.posApiKey) {
      setPosTestStatus("error")
      setPosTestMessage("Please fill in provider, store ID, and API key")
      return
    }
    setPosTestStatus("testing")
    setPosTestMessage("")
    try {
      const res = await fetch("/api/pos/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: leaseForm.posProvider,
          storeId: leaseForm.posStoreId,
          apiKey: leaseForm.posApiKey,
        }),
      })
      const result = await res.json()
      if (result.success) {
        setPosTestStatus("success")
        setPosTestMessage(result.data.message || "Connection successful!")
      } else {
        setPosTestStatus("error")
        setPosTestMessage(result.error || "Connection failed")
      }
    } catch {
      setPosTestStatus("error")
      setPosTestMessage("Failed to test connection")
    }
  }

  // Fetch leases
  const fetchLeases = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedProperty) params.set("propertyId", selectedProperty.id)
      if (statusFilter !== "all") params.set("status", statusFilter)
      
      const url = params.toString() ? `/api/leases?${params.toString()}` : "/api/leases"
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch leases")
      const result = await response.json()
      setLeases(result.data || result || [])
    } catch (error) {
      console.error("Error fetching leases:", error)
      toast({ title: "Error", description: "Failed to load leases", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [selectedProperty, statusFilter, toast])

  // Fetch tenants for dropdown - based on form's selected property
  const fetchTenantsForProperty = React.useCallback(async (propertyId: string) => {
    if (!propertyId) {
      setTenants([])
      return
    }
    try {
      const response = await fetch(`/api/tenants?propertyId=${propertyId}`)
      if (response.ok) {
        const result = await response.json()
        setTenants(result.data || result || [])
      }
    } catch (error) {
      console.error("Error fetching tenants:", error)
      setTenants([])
    }
  }, [])

  // Fetch properties for dropdown (always fresh data)
  const fetchProperties = React.useCallback(async () => {
    try {
      const response = await fetch("/api/properties?refresh=true")
      if (response.ok) {
        const result = await response.json()
        setProperties(result.data || result || [])
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    }
  }, [])

  React.useEffect(() => {
    fetchLeases()
    fetchProperties()
  }, [fetchLeases, fetchProperties])

  // Handle property change in the form - fetch tenants for selected property
  const handlePropertyChange = React.useCallback((propertyId: string) => {
    setLeaseForm(prev => ({ ...prev, propertyId, tenantId: "" })) // Reset tenant when property changes
    fetchTenantsForProperty(propertyId)
  }, [fetchTenantsForProperty])

  // Create lease handler
  const handleCreateLease = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leaseForm,
          areaSqft: parseFloat(leaseForm.areaSqft),
          baseRent: leaseForm.baseRent ? parseFloat(leaseForm.baseRent) : null,
          revenueSharePercentage: leaseForm.revenueSharePercentage ? parseFloat(leaseForm.revenueSharePercentage) : null,
          camCharges: leaseForm.camCharges ? parseFloat(leaseForm.camCharges) : null,
          securityDeposit: leaseForm.securityDeposit ? parseFloat(leaseForm.securityDeposit) : null,
          escalationRate: leaseForm.escalationRate ? parseFloat(leaseForm.escalationRate) : null,
          escalationFrequency: leaseForm.escalationFrequency ? parseInt(leaseForm.escalationFrequency) : null,
          lockInPeriod: leaseForm.lockInPeriod ? parseInt(leaseForm.lockInPeriod) : null,
          terminationNoticeDays: leaseForm.terminationNoticeDays ? parseInt(leaseForm.terminationNoticeDays) : null,
          fitOutPeriod: leaseForm.fitOutPeriod ? parseInt(leaseForm.fitOutPeriod) : null,
          rentFreePeriod: leaseForm.rentFreePeriod ? parseInt(leaseForm.rentFreePeriod) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create lease")
      }

      toast({ title: "Success", description: "Lease created successfully!" })
      setCreateDialogOpen(false)
      setPosTestStatus("idle")
      setPosTestMessage("")
      setLeaseForm({
        tenantId: "",
        propertyId: "",
        unitNumber: "",
        floor: "",
        zone: "",
        areaSqft: "",
        leaseType: "fixed_rent",
        baseRent: "",
        revenueSharePercentage: "",
        camCharges: "",
        securityDeposit: "",
        startDate: "",
        endDate: "",
        escalationRate: "",
        escalationFrequency: "12",
        lockInPeriod: "",
        terminationNoticeDays: "90",
        fitOutPeriod: "",
        rentFreePeriod: "",
        posProvider: "",
        posStoreId: "",
        posApiKey: "",
        posSyncFrequency: "daily",
      })
      fetchLeases()
    } catch (error) {
      console.error("Error creating lease:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create lease",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Stats calculations
  const activeLeases = leases.filter(l => l.status === "active").length
  const totalMonthlyRent = leases
    .filter(l => l.status === "active")
    .reduce((sum, l) => sum + parseFloat(l.baseRent || "0"), 0)
  
  const expiringLeases = leases.filter(l => {
    if (l.status !== "active") return false
    const daysToExpiry = differenceInDays(new Date(l.endDate), new Date())
    return daysToExpiry > 0 && daysToExpiry <= 90
  }).length

  const totalArea = leases
    .filter(l => l.status === "active")
    .reduce((sum, l) => sum + parseFloat(l.areaSqft || "0"), 0)

  // Filter leases
  const filteredLeases = leases.filter(lease => {
    const matchesSearch = 
      lease.tenant?.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.property?.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lease Management</h1>
          <p className="text-muted-foreground">
            Manage lease agreements across all properties
            {selectedProperty && ` • ${selectedProperty.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => fetchLeases()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1 bg-emerald-500 hover:bg-emerald-600">
                <Plus className="h-4 w-4" /> Create Lease
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateLease}>
                <DialogHeader>
                  <DialogTitle>Create New Lease</DialogTitle>
                  <DialogDescription>Set up a lease agreement for a tenant</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="mt-4">
                  <TabsList className={cn("grid w-full", isRevShareLease ? "grid-cols-4" : "grid-cols-3")}>
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="financial">Financial Terms</TabsTrigger>
                    <TabsTrigger value="terms">Lease Terms</TabsTrigger>
                    {isRevShareLease && (
                      <TabsTrigger value="pos" className="gap-1">
                        <Wifi className="h-3 w-3" /> POS Integration
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Basic Info Tab */}
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Property *</label>
                        <Select value={leaseForm.propertyId} onValueChange={handlePropertyChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} ({p.city})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tenant *</label>
                        <Select 
                          value={leaseForm.tenantId} 
                          onValueChange={(v) => setLeaseForm({...leaseForm, tenantId: v})}
                          disabled={!leaseForm.propertyId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={!leaseForm.propertyId ? "Select property first" : "Select tenant"} />
                          </SelectTrigger>
                          <SelectContent>
                            {tenants.length === 0 ? (
                              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                No tenants found for this property
                              </div>
                            ) : (
                              tenants.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.businessName}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Unit Number *</label>
                        <Input value={leaseForm.unitNumber} onChange={(e) => setLeaseForm({...leaseForm, unitNumber: e.target.value})} placeholder="e.g., G-12" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Floor</label>
                        <Select value={leaseForm.floor} onValueChange={(v) => setLeaseForm({...leaseForm, floor: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select floor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basement">Basement</SelectItem>
                            <SelectItem value="ground">Ground Floor</SelectItem>
                            <SelectItem value="1">1st Floor</SelectItem>
                            <SelectItem value="2">2nd Floor</SelectItem>
                            <SelectItem value="3">3rd Floor</SelectItem>
                            <SelectItem value="4">4th Floor</SelectItem>
                            <SelectItem value="5">5th Floor</SelectItem>
                            <SelectItem value="6">6th Floor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Zone</label>
                        <Input value={leaseForm.zone} onChange={(e) => setLeaseForm({...leaseForm, zone: e.target.value})} placeholder="e.g., A" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Area (sq.ft) *</label>
                        <Input type="number" value={leaseForm.areaSqft} onChange={(e) => setLeaseForm({...leaseForm, areaSqft: e.target.value})} placeholder="1000" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Lease Type</label>
                        <Select value={leaseForm.leaseType} onValueChange={(v) => setLeaseForm({...leaseForm, leaseType: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed_rent">Fixed Rent</SelectItem>
                            <SelectItem value="revenue_share">Revenue Share</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="minimum_guarantee">Minimum Guarantee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Financial Terms Tab */}
                  <TabsContent value="financial" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Base Rent (₹/month)</label>
                        <Input type="number" value={leaseForm.baseRent} onChange={(e) => setLeaseForm({...leaseForm, baseRent: e.target.value})} placeholder="50000" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Revenue Share (%)</label>
                        <Input type="number" value={leaseForm.revenueSharePercentage} onChange={(e) => setLeaseForm({...leaseForm, revenueSharePercentage: e.target.value})} placeholder="10" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">CAM Charges (₹/month)</label>
                        <Input type="number" value={leaseForm.camCharges} onChange={(e) => setLeaseForm({...leaseForm, camCharges: e.target.value})} placeholder="5000" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Security Deposit (₹)</label>
                        <Input type="number" value={leaseForm.securityDeposit} onChange={(e) => setLeaseForm({...leaseForm, securityDeposit: e.target.value})} placeholder="150000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Escalation Rate (%/year)</label>
                        <Input type="number" value={leaseForm.escalationRate} onChange={(e) => setLeaseForm({...leaseForm, escalationRate: e.target.value})} placeholder="10" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Escalation Frequency (months)</label>
                        <Select value={leaseForm.escalationFrequency} onValueChange={(v) => setLeaseForm({...leaseForm, escalationFrequency: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12">Annually (12 months)</SelectItem>
                            <SelectItem value="24">Bi-annually (24 months)</SelectItem>
                            <SelectItem value="36">Every 3 years (36 months)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Lease Terms Tab */}
                  <TabsContent value="terms" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Start Date *</label>
                        <Input type="date" value={leaseForm.startDate} onChange={(e) => setLeaseForm({...leaseForm, startDate: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">End Date *</label>
                        <Input type="date" value={leaseForm.endDate} onChange={(e) => setLeaseForm({...leaseForm, endDate: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Lock-in Period (months)</label>
                        <Input type="number" value={leaseForm.lockInPeriod} onChange={(e) => setLeaseForm({...leaseForm, lockInPeriod: e.target.value})} placeholder="12" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Termination Notice (days)</label>
                        <Input type="number" value={leaseForm.terminationNoticeDays} onChange={(e) => setLeaseForm({...leaseForm, terminationNoticeDays: e.target.value})} placeholder="90" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Fit-out Period (days)</label>
                        <Input type="number" value={leaseForm.fitOutPeriod} onChange={(e) => setLeaseForm({...leaseForm, fitOutPeriod: e.target.value})} placeholder="30" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Rent-Free Period (days)</label>
                        <Input type="number" value={leaseForm.rentFreePeriod} onChange={(e) => setLeaseForm({...leaseForm, rentFreePeriod: e.target.value})} placeholder="0" />
                      </div>
                    </div>
                  </TabsContent>

                  {/* POS Integration Tab — Only for revenue_share/hybrid leases */}
                  {isRevShareLease && (
                    <TabsContent value="pos" className="space-y-4 mt-4">
                      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 mb-2">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <Zap className="h-4 w-4" />
                          <span className="font-medium">Connect POS to auto-calculate revenue share from actual sales data</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1 ml-6">
                          Once connected, daily sales data is pulled automatically and revenue share invoices are generated from real POS transactions.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">POS Provider</label>
                        <Select value={leaseForm.posProvider} onValueChange={(v) => { setLeaseForm({...leaseForm, posProvider: v}); setPosTestStatus("idle"); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select POS system" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Indian Providers</div>
                            <SelectItem value="pine_labs">🌲 Pine Labs</SelectItem>
                            <SelectItem value="razorpay_pos">⚡ Razorpay POS</SelectItem>
                            <SelectItem value="petpooja">🍽️ Petpooja</SelectItem>
                            <SelectItem value="posist">🏪 POSist</SelectItem>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-1">Global Providers</div>
                            <SelectItem value="shopify">🛍️ Shopify POS</SelectItem>
                            <SelectItem value="square">🟦 Square</SelectItem>
                            <SelectItem value="lightspeed">💡 Lightspeed</SelectItem>
                            <SelectItem value="vend">🏷️ Vend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Store ID / Location ID</label>
                          <Input
                            value={leaseForm.posStoreId}
                            onChange={(e) => { setLeaseForm({...leaseForm, posStoreId: e.target.value}); setPosTestStatus("idle"); }}
                            placeholder="e.g., store-123 or LOC-456"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">API Key / Access Token</label>
                          <Input
                            type="password"
                            value={leaseForm.posApiKey}
                            onChange={(e) => { setLeaseForm({...leaseForm, posApiKey: e.target.value}); setPosTestStatus("idle"); }}
                            placeholder="Enter API key"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sync Frequency</label>
                        <Select value={leaseForm.posSyncFrequency} onValueChange={(v) => setLeaseForm({...leaseForm, posSyncFrequency: v})}>
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

                      {/* Test Connection */}
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestPOSConnection}
                          disabled={posTestStatus === "testing" || !leaseForm.posProvider || !leaseForm.posStoreId || !leaseForm.posApiKey}
                          className="gap-2"
                        >
                          {posTestStatus === "testing" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : posTestStatus === "success" ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : posTestStatus === "error" ? (
                            <WifiOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Wifi className="h-4 w-4" />
                          )}
                          {posTestStatus === "testing" ? "Testing..." : "Test Connection"}
                        </Button>
                        {posTestMessage && (
                          <span className={cn("text-sm", posTestStatus === "success" ? "text-emerald-600" : "text-red-600")}>
                            {posTestMessage}
                          </span>
                        )}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600">
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Lease
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
            <FileSignature className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeases}</div>
            <p className="text-xs text-muted-foreground">{leases.length} total leases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyRent)}</div>
            <p className="text-xs text-emerald-600">From active leases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leased Area</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArea.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">sq.ft under active leases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringLeases}</div>
            <p className="text-xs text-amber-600">Within 90 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lease Directory</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leases..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLeases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Leases Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "Create your first lease to get started"}
              </p>
              <Button className="gap-1 bg-emerald-500 hover:bg-emerald-600" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" /> Create Lease
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeases.map((lease) => {
                  const daysToExpiry = differenceInDays(new Date(lease.endDate), new Date())
                  const isExpiringSoon = daysToExpiry > 0 && daysToExpiry <= 90
                  
                  return (
                    <TableRow key={lease.id}>
                      <TableCell>
                        <div>
                          <Link href={`/tenants/${lease.tenant?.id}`} className="font-medium hover:underline">
                            {lease.tenant?.businessName || "Unknown"}
                          </Link>
                          <p className="text-xs text-muted-foreground">{lease.tenant?.contactPerson}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{lease.property?.name}</span>
                          <p className="text-xs text-muted-foreground">
                            Unit {lease.unitNumber} • {lease.floor || "Ground"} Floor
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{parseFloat(lease.areaSqft).toLocaleString()} sq.ft</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{formatCurrency(parseFloat(lease.baseRent || "0"))}</span>
                          <p className="text-xs text-muted-foreground">/month</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(lease.startDate), "dd MMM yyyy")}</div>
                          <div className="text-muted-foreground">to {format(new Date(lease.endDate), "dd MMM yyyy")}</div>
                          {isExpiringSoon && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 mt-1">
                              {daysToExpiry} days left
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{leaseTypeLabels[lease.leaseType] || lease.leaseType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", statusConfig[lease.status || "active"]?.color)}>
                          {statusConfig[lease.status || "active"]?.icon}
                          {statusConfig[lease.status || "active"]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedLease(lease); setViewDialogOpen(true); }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/tenants/${lease.tenant?.id}`}>
                                <Building2 className="h-4 w-4 mr-2" /> View Tenant
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/financials?leaseId=${lease.id}`}>
                                <IndianRupee className="h-4 w-4 mr-2" /> View Invoices
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Lease Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lease Details</DialogTitle>
            <DialogDescription>
              {selectedLease?.tenant?.businessName} - Unit {selectedLease?.unitNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedLease && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Property</label>
                  <p className="font-medium">{selectedLease.property?.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Unit / Floor</label>
                  <p className="font-medium">{selectedLease.unitNumber} / {selectedLease.floor || "Ground"}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Area</label>
                  <p className="font-medium">{parseFloat(selectedLease.areaSqft).toLocaleString()} sq.ft</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Lease Type</label>
                  <p className="font-medium">{leaseTypeLabels[selectedLease.leaseType] || selectedLease.leaseType}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Base Rent</label>
                  <p className="font-medium">{formatCurrency(parseFloat(selectedLease.baseRent || "0"))}/month</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">CAM Charges</label>
                  <p className="font-medium">{formatCurrency(parseFloat(selectedLease.camCharges || "0"))}/month</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Security Deposit</label>
                  <p className="font-medium">{formatCurrency(parseFloat(selectedLease.securityDeposit || "0"))}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Escalation</label>
                  <p className="font-medium">{selectedLease.rentEscalationPercentage || "0"}% / {selectedLease.escalationFrequencyMonths || 12} months</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Start Date</label>
                  <p className="font-medium">{format(new Date(selectedLease.startDate), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">End Date</label>
                  <p className="font-medium">{format(new Date(selectedLease.endDate), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Lock-in Period</label>
                  <p className="font-medium">{selectedLease.lockInPeriodMonths || 0} months</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Notice Period</label>
                  <p className="font-medium">{selectedLease.noticePeriodMonths || 3} months</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
              <Link href={`/tenants/${selectedLease?.tenant?.id}`}>View Tenant</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

