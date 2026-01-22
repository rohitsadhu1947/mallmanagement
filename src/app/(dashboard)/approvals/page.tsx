"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { ConfidenceMeter } from "@/components/agents/confidence-meter"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Bot,
  Search,
  Filter,
  AlertTriangle,
  Eye,
  Wrench,
  DollarSign,
  Users,
  Activity,
  LayoutGrid,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw } from "lucide-react"

interface PendingApproval {
  id: string
  agentId: string
  agentName: string
  agentType: string
  actionType: string
  title: string
  description: string
  reasoning: string
  confidence: number
  impact: "low" | "medium" | "high" | "critical"
  createdAt: Date
  entityType: string
  entityId: string
  data: Record<string, unknown>
}

const mockPendingApprovals: PendingApproval[] = [
  {
    id: "1",
    agentId: "maintenance-coordinator",
    agentName: "Maintenance Coordinator",
    agentType: "maintenance_coordinator",
    actionType: "schedule_maintenance",
    title: "Schedule Preventive Maintenance for HVAC Unit #4",
    description: "HVAC Unit #4 showing degraded performance. Scheduling preventive maintenance to avoid failure.",
    reasoning: "Health score dropped to 73%. Historical data shows similar units failed within 2 weeks of reaching this threshold. Cost of preventive maintenance: ₹15,000. Cost of emergency repair: ₹85,000+.",
    confidence: 0.73,
    impact: "high",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    entityType: "equipment",
    entityId: "eq-hvac-004",
    data: { estimatedCost: 15000, scheduledDate: "2024-01-20", vendor: "CoolTech Services" },
  },
  {
    id: "2",
    agentId: "space-optimizer",
    agentName: "Space Optimization Strategist",
    agentType: "space_optimizer",
    actionType: "lease_non_renewal",
    title: "Recommend Non-Renewal: Tech World Electronics",
    description: "Lease expiring in 60 days. Tenant underperforming compared to mall average.",
    reasoning: "Revenue per sq.ft: ₹800 (mall avg: ₹1,200). Category performance below benchmark for 6 months. Potential replacement with F&B tenant could increase revenue by ₹70,000/month.",
    confidence: 0.68,
    impact: "critical",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    entityType: "lease",
    entityId: "lease-twl-105",
    data: { currentRent: 100000, projectedNewRent: 170000, expiryDate: "2024-03-15" },
  },
  {
    id: "3",
    agentId: "financial-analyst",
    agentName: "Financial Analyst",
    agentType: "financial_analyst",
    actionType: "escalate_collection",
    title: "Escalate Collection: Café Coffee Day",
    description: "Invoice overdue by 15 days. Previous reminders ineffective.",
    reasoning: "3 gentle reminders sent without response. Payment pattern shows 85% probability of 30+ day delay. Recommending escalation to formal collection notice.",
    confidence: 0.82,
    impact: "medium",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    entityType: "invoice",
    entityId: "inv-2024-001235",
    data: { amount: 153400, dueDate: "2024-01-05", remindersSent: 3 },
  },
  {
    id: "4",
    agentId: "financial-analyst",
    agentName: "Financial Analyst",
    agentType: "financial_analyst",
    actionType: "expense_approval",
    title: "Approve Expense: Emergency Generator Repair",
    description: "Emergency repair expense exceeding auto-approval threshold.",
    reasoning: "Generator #2 failure required emergency repair. Expense of ₹75,000 exceeds ₹50,000 auto-approval limit. Vendor quote verified against market rates (15% below average).",
    confidence: 0.91,
    impact: "high",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    entityType: "expense",
    entityId: "exp-gen-repair",
    data: { amount: 75000, vendor: "PowerGen Solutions", marketRate: 88000 },
  },
  {
    id: "5",
    agentId: "operations-commander",
    agentName: "Operations Commander",
    agentType: "operations_commander",
    actionType: "staff_alert",
    title: "Security Alert: Unusual After-Hours Activity",
    description: "Motion detected in restricted area after business hours.",
    reasoning: "CCTV motion detected at 11:45 PM in Zone B storage area. No scheduled maintenance or authorized access logged. Recommending security team dispatch.",
    confidence: 0.79,
    impact: "critical",
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    entityType: "security",
    entityId: "alert-sec-001",
    data: { location: "Zone B Storage", timestamp: "23:45", cameraId: "CAM-B-12" },
  },
]

const agentIcons: Record<string, React.ReactNode> = {
  operations_commander: <Activity className="h-4 w-4" />,
  tenant_relations: <Users className="h-4 w-4" />,
  financial_analyst: <DollarSign className="h-4 w-4" />,
  maintenance_coordinator: <Wrench className="h-4 w-4" />,
  space_optimizer: <LayoutGrid className="h-4 w-4" />,
  compliance_monitor: <Shield className="h-4 w-4" />,
}

const agentColors: Record<string, string> = {
  operations_commander: "bg-blue-500",
  tenant_relations: "bg-emerald-500",
  financial_analyst: "bg-amber-500",
  maintenance_coordinator: "bg-red-500",
  space_optimizer: "bg-purple-500",
  compliance_monitor: "bg-slate-500",
}

const impactConfig = {
  low: { label: "Low Impact", color: "bg-gray-100 text-gray-700" },
  medium: { label: "Medium Impact", color: "bg-blue-100 text-blue-700" },
  high: { label: "High Impact", color: "bg-amber-100 text-amber-700" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function ApprovalCard({
  approval,
  onApprove,
  onReject,
  onViewDetails,
  isProcessing,
}: {
  approval: PendingApproval
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onViewDetails: (approval: PendingApproval) => void
  isProcessing: boolean
}) {
  const impact = impactConfig[approval.impact]

  return (
    <Card className="relative overflow-hidden">
      <div className={cn("absolute left-0 top-0 h-full w-1", agentColors[approval.agentType])} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white shrink-0", agentColors[approval.agentType])}>
              {agentIcons[approval.agentType]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">{approval.agentName}</span>
                <Badge className={cn("text-xs", impact.color)}>{impact.label}</Badge>
              </div>
              <h3 className="font-semibold text-sm mb-1">{approval.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{approval.description}</p>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  <ConfidenceMeter confidence={approval.confidence} showLabel size="sm" />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTimeAgo(approval.createdAt)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              size="sm"
              className="gap-1"
              onClick={() => onApprove(approval.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => onReject(approval.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
              onClick={() => onViewDetails(approval)}
              disabled={isProcessing}
            >
              <Eye className="h-4 w-4" />
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ApprovalsPage() {
  const { toast } = useToast()
  const [approvals, setApprovals] = React.useState<PendingApproval[]>(mockPendingApprovals)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [agentFilter, setAgentFilter] = React.useState<string>("all")
  const [impactFilter, setImpactFilter] = React.useState<string>("all")
  const [selectedApproval, setSelectedApproval] = React.useState<PendingApproval | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [processingId, setProcessingId] = React.useState<string | null>(null)

  // Fetch pending approvals from API
  const fetchApprovals = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/agents/actions?status=pending")
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          // Map API data to our format
          const mapped = data.data.map((action: {
            id: string
            agentId: string
            agentName: string
            agentType: string
            actionType: string
            description: string
            reasoning: string
            confidence: number
            impact: string
            createdAt: string
            entityType: string
            entityId: string
            metadata: Record<string, unknown>
          }) => ({
            id: action.id,
            agentId: action.agentId,
            agentName: action.agentName,
            agentType: action.agentType,
            actionType: action.actionType,
            title: action.description?.split(".")[0] || action.actionType,
            description: action.description || "",
            reasoning: action.reasoning || "",
            confidence: action.confidence,
            impact: action.impact as "low" | "medium" | "high" | "critical" || "medium",
            createdAt: new Date(action.createdAt),
            entityType: action.entityType,
            entityId: action.entityId,
            data: action.metadata || {},
          }))
          setApprovals(mapped)
        }
      }
    } catch (error) {
      console.error("Error fetching approvals:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  const filteredApprovals = approvals.filter((approval) => {
    const matchesSearch = 
      approval.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAgent = agentFilter === "all" || approval.agentType === agentFilter
    const matchesImpact = impactFilter === "all" || approval.impact === impactFilter
    return matchesSearch && matchesAgent && matchesImpact
  })

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      const response = await fetch("/api/agents/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: id, status: "approved" }),
      })
      if (response.ok) {
        setApprovals(prev => prev.filter(a => a.id !== id))
        toast({
          title: "Action Approved",
          description: "The agent action has been approved and will be executed.",
        })
      } else {
        throw new Error("Failed to approve")
      }
    } catch (error) {
      console.error("Error approving action:", error)
      toast({
        title: "Error",
        description: "Failed to approve action. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string, feedback?: string) => {
    setProcessingId(id)
    try {
      const response = await fetch("/api/agents/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: id, status: "rejected", feedback }),
      })
      if (response.ok) {
        setApprovals(prev => prev.filter(a => a.id !== id))
        toast({
          title: "Action Rejected",
          description: "The agent action has been rejected.",
        })
      } else {
        throw new Error("Failed to reject")
      }
    } catch (error) {
      console.error("Error rejecting action:", error)
      toast({
        title: "Error",
        description: "Failed to reject action. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleViewDetails = (approval: PendingApproval) => {
    setSelectedApproval(approval)
    setDetailsOpen(true)
  }

  const criticalCount = approvals.filter(a => a.impact === "critical").length
  const highCount = approvals.filter(a => a.impact === "high").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pending Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve AI agent recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} Critical
            </Badge>
          )}
          {highCount > 0 && (
            <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              {highCount} High Impact
            </Badge>
          )}
          <Button variant="outline" onClick={fetchApprovals} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{approvals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved Today</p>
              <p className="text-2xl font-bold">23</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
              <p className="text-2xl font-bold">
                {approvals.length > 0 
                  ? (approvals.reduce((sum, a) => sum + a.confidence, 0) / approvals.length * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search approvals..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            <SelectItem value="operations_commander">Operations Commander</SelectItem>
            <SelectItem value="tenant_relations">Tenant Relations</SelectItem>
            <SelectItem value="financial_analyst">Financial Analyst</SelectItem>
            <SelectItem value="maintenance_coordinator">Maintenance Coordinator</SelectItem>
            <SelectItem value="space_optimizer">Space Optimizer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={impactFilter} onValueChange={setImpactFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Impact" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Impact</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Approval Cards */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">All caught up!</h3>
              <p className="text-muted-foreground">No pending approvals at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          filteredApprovals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewDetails={handleViewDetails}
              isProcessing={processingId === approval.id}
            />
          ))
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          {selectedApproval && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white", agentColors[selectedApproval.agentType])}>
                    {agentIcons[selectedApproval.agentType]}
                  </div>
                  <DialogTitle>{selectedApproval.title}</DialogTitle>
                </div>
                <DialogDescription>{selectedApproval.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Agent Reasoning</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {selectedApproval.reasoning}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <div className="mt-1">
                      <ConfidenceMeter confidence={selectedApproval.confidence} showLabel />
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Impact:</span>
                    <div className="mt-1">
                      <Badge className={impactConfig[selectedApproval.impact].color}>
                        {impactConfig[selectedApproval.impact].label}
                      </Badge>
                    </div>
                  </div>
                </div>
                {selectedApproval.data && Object.keys(selectedApproval.data).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Additional Data</h4>
                    <div className="bg-muted p-3 rounded-lg">
                      <pre className="text-sm">
                        {JSON.stringify(selectedApproval.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleReject(selectedApproval.id)
                    setDetailsOpen(false)
                  }}
                  disabled={processingId === selectedApproval.id}
                >
                  {processingId === selectedApproval.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button 
                  onClick={() => {
                    handleApprove(selectedApproval.id)
                    setDetailsOpen(false)
                  }}
                  disabled={processingId === selectedApproval.id}
                >
                  {processingId === selectedApproval.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

