"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Thermometer,
  Droplets,
  Shield,
  Sparkles,
  MoreHorizontal,
  Bot,
  RefreshCw,
  Loader2,
  Eye,
  Play,
  UserPlus,
  ArrowUp,
  XCircle,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface WorkOrder {
  id: string
  workOrderNumber: string
  category: string
  priority: string
  title: string
  description: string | null
  location: string | null
  status: string
  reportedAt: string
  assignedTo: string | null
  resolvedAt: string | null
  tenant: {
    id: string
    businessName: string
    contactPerson: string | null
  } | null
  createdByAgent: boolean
}

const categoryIcons: Record<string, React.ReactNode> = {
  hvac: <Thermometer className="h-4 w-4" />,
  plumbing: <Droplets className="h-4 w-4" />,
  electrical: <Zap className="h-4 w-4" />,
  cleaning: <Sparkles className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  general: <Wrench className="h-4 w-4" />,
}

const categoryColors: Record<string, string> = {
  hvac: "bg-blue-100 text-blue-700",
  plumbing: "bg-cyan-100 text-cyan-700",
  electrical: "bg-yellow-100 text-yellow-700",
  cleaning: "bg-green-100 text-green-700",
  security: "bg-red-100 text-red-700",
  general: "bg-gray-100 text-gray-700",
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-gray-100 text-gray-700", label: "Low" },
  medium: { color: "bg-blue-100 text-blue-700", label: "Medium" },
  high: { color: "bg-orange-100 text-orange-700", label: "High" },
  critical: { color: "bg-red-100 text-red-700", label: "Critical" },
}

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  open: { color: "bg-yellow-100 text-yellow-700", label: "Open", icon: <AlertCircle className="h-3 w-3" /> },
  in_progress: { color: "bg-blue-100 text-blue-700", label: "In Progress", icon: <Clock className="h-3 w-3" /> },
  resolved: { color: "bg-green-100 text-green-700", label: "Resolved", icon: <CheckCircle2 className="h-3 w-3" /> },
  escalated: { color: "bg-red-100 text-red-700", label: "Escalated", icon: <AlertCircle className="h-3 w-3" /> },
}

export default function WorkOrdersPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tenantIdFilter = searchParams.get("tenantId")
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = React.useState<WorkOrder | null>(null)
  const [filterTenantName, setFilterTenantName] = React.useState<string | null>(null)

  // Form state
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    location: "",
  })

  const [assignee, setAssignee] = React.useState("")

  // Handler for viewing work order details
  const handleViewWorkOrder = (wo: WorkOrder) => {
    setSelectedWorkOrder(wo)
    setViewDialogOpen(true)
  }

  // Handler for updating status
  const handleUpdateStatus = async (wo: WorkOrder, newStatus: string) => {
    try {
      const response = await fetch(`/api/work-orders/${wo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast({
        title: "Status Updated",
        description: `Work order ${wo.workOrderNumber} is now ${newStatus.replace("_", " ")}`,
      })

      fetchWorkOrders()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handler for assigning work order
  const handleAssignWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkOrder || !assignee) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/work-orders/${selectedWorkOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          assignedTo: assignee,
          status: selectedWorkOrder.status === "open" ? "in_progress" : selectedWorkOrder.status,
        }),
      })

      if (!response.ok) throw new Error("Failed to assign work order")

      toast({
        title: "Work Order Assigned",
        description: `Work order ${selectedWorkOrder.workOrderNumber} assigned to ${assignee}`,
      })

      setAssignDialogOpen(false)
      setAssignee("")
      fetchWorkOrders()
    } catch (error) {
      console.error("Error assigning work order:", error)
      toast({
        title: "Error",
        description: "Failed to assign work order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler for escalating work order
  const handleEscalate = async (wo: WorkOrder) => {
    try {
      const response = await fetch(`/api/work-orders/${wo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "escalated",
          priority: "critical",
        }),
      })

      if (!response.ok) throw new Error("Failed to escalate")

      toast({
        title: "Work Order Escalated",
        description: `Work order ${wo.workOrderNumber} has been escalated to critical priority`,
      })

      fetchWorkOrders()
    } catch (error) {
      console.error("Error escalating:", error)
      toast({
        title: "Error",
        description: "Failed to escalate work order. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handler for cancelling work order
  const handleCancel = async (wo: WorkOrder) => {
    if (!confirm(`Are you sure you want to cancel work order ${wo.workOrderNumber}?`)) return

    try {
      const response = await fetch(`/api/work-orders/${wo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (!response.ok) throw new Error("Failed to cancel")

      toast({
        title: "Work Order Cancelled",
        description: `Work order ${wo.workOrderNumber} has been cancelled`,
      })

      fetchWorkOrders()
    } catch (error) {
      console.error("Error cancelling:", error)
      toast({
        title: "Error",
        description: "Failed to cancel work order. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Open assign dialog
  const handleOpenAssignDialog = (wo: WorkOrder) => {
    setSelectedWorkOrder(wo)
    setAssignee(wo.assignedTo || "")
    setAssignDialogOpen(true)
  }

  // Fetch work orders from API
  const fetchWorkOrders = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (priorityFilter !== "all") params.set("priority", priorityFilter)
      if (tenantIdFilter) params.set("tenantId", tenantIdFilter)
      
      const url = `/api/work-orders${params.toString() ? `?${params}` : ""}`
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch work orders")
      const data = await response.json()
      setWorkOrders(data)
      
      // If filtering by tenant, get tenant name from first work order
      if (tenantIdFilter && data.length > 0 && data[0].tenant) {
        setFilterTenantName(data[0].tenant.businessName)
      }
    } catch (error) {
      console.error("Error fetching work orders:", error)
      toast({
        title: "Error",
        description: "Failed to load work orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, priorityFilter, tenantIdFilter, toast])

  React.useEffect(() => {
    fetchWorkOrders()
  }, [fetchWorkOrders])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          propertyId: "default", // Would come from context/state
        }),
      })

      if (!response.ok) throw new Error("Failed to create work order")

      toast({
        title: "Success",
        description: "Work order created successfully!",
      })

      setDialogOpen(false)
      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "",
        location: "",
      })
      fetchWorkOrders()
    } catch (error) {
      console.error("Error creating work order:", error)
      toast({
        title: "Error",
        description: "Failed to create work order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesSearch =
      wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.tenant?.businessName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || wo.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const stats = {
    total: workOrders.length,
    open: workOrders.filter((wo) => wo.status === "open").length,
    inProgress: workOrders.filter((wo) => wo.status === "in_progress").length,
    critical: workOrders.filter((wo) => wo.priority === "critical" && wo.status !== "resolved").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">
            Manage maintenance requests and track resolution
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchWorkOrders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Work Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Work Order</DialogTitle>
                  <DialogDescription>
                    Create a new maintenance or repair request.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Title *</label>
                    <Input 
                      placeholder="Brief description of the issue" 
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Category *</label>
                      <Select 
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hvac">HVAC</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input 
                      placeholder="e.g., Unit 203, 2nd Floor" 
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Detailed description of the issue..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Work Order
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
            <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.critical}</div>
            <p className="text-xs text-red-600">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Work Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Work Orders</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search work orders..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
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
          ) : filteredWorkOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No work orders found</h3>
              <p className="text-muted-foreground">
                {workOrders.length === 0
                  ? "Create your first work order to get started"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tenant / Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkOrders.map((wo) => {
                  const priority = priorityConfig[wo.priority] || priorityConfig.medium
                  const status = statusConfig[wo.status] || statusConfig.open
                  return (
                    <TableRow key={wo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">
                                {wo.workOrderNumber}
                              </span>
                              {wo.createdByAgent && (
                                <Badge variant="outline" className="text-[10px] gap-1 h-5">
                                  <Bot className="h-3 w-3" />
                                  AI Created
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {wo.title}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`gap-1 ${categoryColors[wo.category] || categoryColors.general}`}>
                          {categoryIcons[wo.category] || categoryIcons.general}
                          {wo.category?.toUpperCase() || "GENERAL"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {wo.tenant ? (
                          <div>
                            <div className="font-medium">{wo.tenant.businessName}</div>
                            <div className="text-xs text-muted-foreground">{wo.location || "N/A"}</div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">{wo.location || "N/A"}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={priority.color}>{priority.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {wo.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">
                                {wo.assignedTo.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{wo.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {wo.reportedAt ? formatRelativeTime(new Date(wo.reportedAt)) : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewWorkOrder(wo)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {wo.status !== "resolved" && wo.status !== "cancelled" && (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenAssignDialog(wo)}>
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  {wo.assignedTo ? "Reassign" : "Assign"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {wo.status === "open" && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(wo, "in_progress")}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Work
                                  </DropdownMenuItem>
                                )}
                                {wo.status === "in_progress" && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(wo, "resolved")}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                    Mark Resolved
                                  </DropdownMenuItem>
                                )}
                                {wo.status !== "escalated" && wo.priority !== "critical" && (
                                  <DropdownMenuItem onClick={() => handleEscalate(wo)}>
                                    <ArrowUp className="mr-2 h-4 w-4 text-red-600" />
                                    Escalate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleCancel(wo)}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* View Work Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Work Order Details</DialogTitle>
            <DialogDescription>
              {selectedWorkOrder?.workOrderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedWorkOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <Badge className={`mt-1 gap-1 ${categoryColors[selectedWorkOrder.category] || categoryColors.general}`}>
                    {categoryIcons[selectedWorkOrder.category] || categoryIcons.general}
                    {selectedWorkOrder.category?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge className={`mt-1 ${priorityConfig[selectedWorkOrder.priority]?.color || ""}`}>
                    {priorityConfig[selectedWorkOrder.priority]?.label || selectedWorkOrder.priority}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={`mt-1 gap-1 ${statusConfig[selectedWorkOrder.status]?.color || ""}`}>
                    {statusConfig[selectedWorkOrder.status]?.icon}
                    {statusConfig[selectedWorkOrder.status]?.label || selectedWorkOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                  <p className="font-medium mt-1">{selectedWorkOrder.assignedTo || "Unassigned"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Title</p>
                <p className="font-medium mt-1">{selectedWorkOrder.title}</p>
              </div>
              {selectedWorkOrder.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm">{selectedWorkOrder.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="font-medium mt-1">{selectedWorkOrder.location || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tenant</p>
                  <p className="font-medium mt-1">{selectedWorkOrder.tenant?.businessName || "N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reported</p>
                  <p className="font-medium mt-1">
                    {selectedWorkOrder.reportedAt 
                      ? new Date(selectedWorkOrder.reportedAt).toLocaleDateString() 
                      : "N/A"}
                  </p>
                </div>
                {selectedWorkOrder.resolvedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                    <p className="font-medium mt-1">
                      {new Date(selectedWorkOrder.resolvedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedWorkOrder.createdByAgent && (
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <Bot className="h-4 w-4" />
                  Created by AI Agent
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedWorkOrder?.status !== "resolved" && selectedWorkOrder?.status !== "cancelled" && (
              <Button onClick={() => {
                setViewDialogOpen(false)
                handleOpenAssignDialog(selectedWorkOrder!)
              }}>
                {selectedWorkOrder?.assignedTo ? "Reassign" : "Assign"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Work Order Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleAssignWorkOrder}>
            <DialogHeader>
              <DialogTitle>Assign Work Order</DialogTitle>
              <DialogDescription>
                {selectedWorkOrder?.workOrderNumber} - {selectedWorkOrder?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Assign To *</label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="John Smith">John Smith (Technician)</SelectItem>
                    <SelectItem value="Mike Johnson">Mike Johnson (Electrician)</SelectItem>
                    <SelectItem value="Sarah Williams">Sarah Williams (HVAC Specialist)</SelectItem>
                    <SelectItem value="David Brown">David Brown (Plumber)</SelectItem>
                    <SelectItem value="External Vendor">External Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !assignee}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
