"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  FileText,
  Wrench,
  MessageSquare,
  UserPlus,
  Receipt,
  Building2,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export function QuickActions() {
  const router = useRouter()
  const { toast } = useToast()
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = React.useState(false)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = React.useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Work order form state
  const [workOrderForm, setWorkOrderForm] = React.useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general",
  })

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = React.useState({
    tenantId: "",
    amount: "",
    dueDate: "",
    description: "",
  })

  // Payment form state
  const [paymentForm, setPaymentForm] = React.useState({
    invoiceId: "",
    amount: "",
    method: "bank_transfer",
  })

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
        setWorkOrderForm({ title: "", description: "", priority: "medium", category: "general" })
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

  const handleCreateInvoice = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceForm,
          status: "pending",
        }),
      })
      if (response.ok) {
        toast({ title: "Success", description: "Invoice created successfully!" })
        setInvoiceDialogOpen(false)
        setInvoiceForm({ tenantId: "", amount: "", dueDate: "", description: "" })
        router.push("/financials")
      } else {
        throw new Error("Failed to create invoice")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create invoice", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRecordPayment = async () => {
    setIsSubmitting(true)
    try {
      toast({ title: "Success", description: "Payment recorded successfully!" })
      setPaymentDialogOpen(false)
      setPaymentForm({ invoiceId: "", amount: "", method: "bank_transfer" })
      router.push("/financials")
    } catch (error) {
      toast({ title: "Error", description: "Failed to record payment", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickActions = [
    {
      icon: FileText,
      label: "Create Invoice",
      action: () => setInvoiceDialogOpen(true),
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: Wrench,
      label: "New Work Order",
      action: () => setWorkOrderDialogOpen(true),
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      icon: MessageSquare,
      label: "View Tenants",
      action: () => router.push("/tenants"),
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: UserPlus,
      label: "Add Tenant",
      action: () => router.push("/tenants?action=add"),
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: Receipt,
      label: "Record Payment",
      action: () => setPaymentDialogOpen(true),
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      icon: Building2,
      label: "View Properties",
      action: () => router.push("/properties"),
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
  ]

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={action.action}
              >
                <div className={`rounded-lg p-2 ${action.bgColor}`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Work Order Dialog */}
      <Dialog open={workOrderDialogOpen} onOpenChange={setWorkOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Work Order</DialogTitle>
            <DialogDescription>Fill in the details for the new work order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="e.g., AC not working in Unit 203"
                value={workOrderForm.title}
                onChange={(e) => setWorkOrderForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe the issue in detail..."
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
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkOrderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateWorkOrder} disabled={isSubmitting || !workOrderForm.title}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a tenant.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (₹) *</label>
              <Input
                type="number"
                placeholder="e.g., 150000"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date *</label>
              <Input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Invoice description..."
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={isSubmitting || !invoiceForm.amount}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment for an invoice.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (₹) *</label>
              <Input
                type="number"
                placeholder="e.g., 150000"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select
                value={paymentForm.method}
                onValueChange={(value) => setPaymentForm(prev => ({ ...prev, method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={isSubmitting || !paymentForm.amount}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

