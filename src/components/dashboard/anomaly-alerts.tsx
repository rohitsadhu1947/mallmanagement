"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, TrendingDown, Clock, Zap, ChevronRight, Loader2 } from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface Anomaly {
  id: string
  type: "warning" | "critical" | "info"
  title: string
  description: string
  detectedAt: Date
  agentType: string
  action?: string
  actionRoute?: string
}

// Mock anomalies - will be replaced with real data
const mockAnomalies: Anomaly[] = [
  {
    id: "1",
    type: "warning",
    title: "Collection Rate Drop",
    description: "Collection rate dropped 5% compared to last week average",
    detectedAt: new Date(Date.now() - 15 * 60 * 1000),
    agentType: "financial_analyst",
    action: "View Details",
    actionRoute: "/analytics",
  },
  {
    id: "2",
    type: "critical",
    title: "HVAC System Alert",
    description: "Floor 3 AC unit showing unusual power consumption",
    detectedAt: new Date(Date.now() - 45 * 60 * 1000),
    agentType: "maintenance_coordinator",
    action: "Create Work Order",
    actionRoute: "work_order_dialog",
  },
  {
    id: "3",
    type: "info",
    title: "Lease Expiry Coming",
    description: "3 leases expiring in next 30 days need attention",
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    agentType: "space_optimizer",
    action: "Review Leases",
    actionRoute: "/tenants",
  },
]

const getAnomalyIcon = (type: string) => {
  switch (type) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case "warning":
      return <TrendingDown className="h-4 w-4 text-yellow-500" />
    default:
      return <Clock className="h-4 w-4 text-blue-500" />
  }
}

const getAnomalyBadge = (type: string) => {
  switch (type) {
    case "critical":
      return <Badge variant="destructive" className="text-[10px]">Critical</Badge>
    case "warning":
      return <Badge variant="warning" className="text-[10px]">Warning</Badge>
    default:
      return <Badge variant="info" className="text-[10px]">Info</Badge>
  }
}

export function AnomalyAlerts() {
  const router = useRouter()
  const { toast } = useToast()
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = React.useState(false)
  const [selectedAnomaly, setSelectedAnomaly] = React.useState<Anomaly | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [workOrderForm, setWorkOrderForm] = React.useState({
    title: "",
    description: "",
    priority: "high",
    category: "hvac",
  })

  const handleActionClick = (anomaly: Anomaly) => {
    if (anomaly.actionRoute === "work_order_dialog") {
      setSelectedAnomaly(anomaly)
      setWorkOrderForm({
        title: `[Alert] ${anomaly.title}`,
        description: anomaly.description,
        priority: anomaly.type === "critical" ? "urgent" : "high",
        category: "hvac",
      })
      setWorkOrderDialogOpen(true)
    } else if (anomaly.actionRoute) {
      router.push(anomaly.actionRoute)
    }
  }

  const handleCreateWorkOrder = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...workOrderForm,
          propertyId: "default",
          status: "pending",
        }),
      })
      if (response.ok) {
        toast({ title: "Success", description: "Work order created successfully!" })
        setWorkOrderDialogOpen(false)
        router.push("/work-orders")
      } else {
        throw new Error("Failed to create work order")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create work order", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-yellow-500" />
              Active Insights
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {mockAnomalies.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockAnomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={cn(
                "rounded-lg border p-3 transition-colors hover:bg-muted/50",
                anomaly.type === "critical" && "border-red-200 bg-red-50/50",
                anomaly.type === "warning" && "border-yellow-200 bg-yellow-50/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {getAnomalyIcon(anomaly.type)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{anomaly.title}</span>
                      {getAnomalyBadge(anomaly.type)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {anomaly.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Detected {formatRelativeTime(anomaly.detectedAt)}
                    </p>
                  </div>
                </div>
              </div>
              {anomaly.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 w-full justify-between text-xs"
                  onClick={() => handleActionClick(anomaly)}
                >
                  {anomaly.action}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full" 
            size="sm"
            onClick={() => router.push("/approvals")}
          >
            View All Insights
          </Button>
        </CardContent>
      </Card>

      {/* Work Order Dialog */}
      <Dialog open={workOrderDialogOpen} onOpenChange={setWorkOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Work Order from Alert</DialogTitle>
            <DialogDescription>
              Create a work order to address: {selectedAnomaly?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={workOrderForm.title}
                onChange={(e) => setWorkOrderForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={workOrderForm.description}
                onChange={(e) => setWorkOrderForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={workOrderForm.priority}
                  onValueChange={(value) => setWorkOrderForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={workOrderForm.category}
                  onValueChange={(value) => setWorkOrderForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkOrderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateWorkOrder} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

