"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Users,
  Plus,
  Search,
  Filter,
  MessageSquare,
  FileText,
  MoreHorizontal,
  Building2,
  TrendingUp,
  TrendingDown,
  Bot,
  RefreshCw,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  Mail,
  Phone,
  FileBarChart,
  AlertTriangle,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { tenantSchema, tenantUpdateSchema, type TenantFormData, type TenantUpdateFormData } from "@/lib/validations/tenant"
import { usePropertyStore } from "@/stores/property-store"

interface Tenant {
  id: string
  businessName: string
  legalEntityName: string | null
  category: string | null
  contactPerson: string | null
  email: string | null
  phone: string | null
  gstin: string | null
  status: string | null
  sentimentScore: string | null
  riskScore: string | null
  satisfactionScore: string | null
  lease: {
    id: string
    unitNumber: string
    floor: number | null
    areaSqft: string
    baseRent: string | null
    startDate: string
    endDate: string
    status: string | null
  } | null
}

const categoryColors: Record<string, string> = {
  fashion: "bg-pink-100 text-pink-700",
  food_beverage: "bg-orange-100 text-orange-700",
  electronics: "bg-blue-100 text-blue-700",
  entertainment: "bg-purple-100 text-purple-700",
  services: "bg-green-100 text-green-700",
}

const getCategoryLabel = (category: string | null) => {
  const labels: Record<string, string> = {
    fashion: "Fashion",
    food_beverage: "F&B",
    electronics: "Electronics",
    entertainment: "Entertainment",
    services: "Services",
  }
  return labels[category || ""] || category || "Other"
}

const getSentimentColor = (score: string | null) => {
  const num = parseFloat(score || "0")
  if (num >= 0.7) return "text-green-600"
  if (num >= 0.4) return "text-yellow-600"
  return "text-red-600"
}

const getRiskBadge = (score: string | null) => {
  const num = parseFloat(score || "0")
  if (num <= 0.2) return { label: "Low Risk", variant: "success" as const }
  if (num <= 0.5) return { label: "Medium Risk", variant: "warning" as const }
  return { label: "High Risk", variant: "destructive" as const }
}

interface Property {
  id: string
  name: string
  code: string
  city: string
}

export default function TenantsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { selectedProperty } = usePropertyStore()
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [properties, setProperties] = React.useState<Property[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedTenant, setSelectedTenant] = React.useState<Tenant | null>(null)

  // Form for creating tenant - comprehensive form with all fields
  const createForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      // Basic Info
      businessName: "",
      legalEntityName: "",
      brandName: "",
      category: undefined,
      subcategory: "",
      businessType: undefined,
      website: "",
      status: "onboarding",
      // Contact Info
      contactPerson: "",
      designation: "",
      email: "",
      phone: "",
      alternatePhone: "",
      authorizedSignatory: "",
      signatoryPhone: "",
      signatoryEmail: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      // Tax & Compliance
      gstin: "",
      pan: "",
      tan: "",
      cin: "",
      fssaiLicense: "",
      tradeLicense: "",
      shopEstablishmentNumber: "",
      // Banking
      bankName: "",
      bankBranch: "",
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      // Address
      registeredAddress: "",
      registeredCity: "",
      registeredState: "",
      registeredPincode: "",
      // Property
      propertyId: "",
      notes: "",
    },
  })

  // Form for editing tenant
  const editForm = useForm<TenantUpdateFormData>({
    resolver: zodResolver(tenantUpdateSchema),
    defaultValues: {
      businessName: "",
      category: undefined,
      contactPerson: "",
      email: "",
      phone: "",
      gstin: "",
    },
  })

  // Fetch properties from API
  const fetchProperties = React.useCallback(async () => {
    try {
      const response = await fetch("/api/properties")
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          setProperties(data.data)
          // Set default property if not already set
          if (data.data.length > 0 && !createForm.getValues("propertyId")) {
            createForm.setValue("propertyId", data.data[0].id)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    }
  }, [createForm])

  // Fetch tenants from API - filtered by selected property
  const fetchTenants = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const url = selectedProperty 
        ? `/api/tenants?propertyId=${selectedProperty.id}`
        : "/api/tenants"
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch tenants")
      const result = await response.json()
      // Handle both { data: [] } format and direct array format for backwards compatibility
      setTenants(result.data || result || [])
    } catch (error) {
      console.error("Error fetching tenants:", error)
      toast({
        title: "Error",
        description: "Failed to load tenants. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchTenants()
    fetchProperties()
  }, [fetchTenants, fetchProperties])

  // Re-fetch tenants when selected property changes
  React.useEffect(() => {
    if (selectedProperty) {
      fetchTenants()
    }
  }, [selectedProperty, fetchTenants])

  // Handle form submission for create
  const handleSubmit = async (data: TenantFormData) => {
    setIsSubmitting(true)

    // Ensure we have a valid property ID
    const propertyId = data.propertyId || properties[0]?.id
    if (!propertyId) {
      toast({
        title: "Error",
        description: "Please select a property. No properties available.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          propertyId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create tenant")
      }

      toast({
        title: "Success",
        description: "Tenant created successfully!",
      })

      setDialogOpen(false)
      createForm.reset()
      // Re-set default property after reset
      if (properties.length > 0) {
        createForm.setValue("propertyId", properties[0].id)
      }
      fetchTenants()
    } catch (error) {
      console.error("Error creating tenant:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tenant. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.lease?.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || tenant.category === categoryFilter
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Action handlers
  const handleViewTenant = (tenant: Tenant) => {
    // Navigate to tenant details page
    router.push(`/tenants/${tenant.id}`)
  }

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    editForm.reset({
      businessName: tenant.businessName,
      category: tenant.category as TenantUpdateFormData["category"],
      contactPerson: tenant.contactPerson || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      gstin: tenant.gstin || "",
    })
    setEditDialogOpen(true)
  }

  const handleDeleteTenant = async (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTenant = async () => {
    if (!selectedTenant) return
    
    try {
      const response = await fetch(`/api/tenants/${selectedTenant.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) throw new Error("Failed to delete tenant")
      
      toast({
        title: "Success",
        description: "Tenant deleted successfully!",
      })
      
      setDeleteDialogOpen(false)
      setSelectedTenant(null)
      fetchTenants()
    } catch (error) {
      console.error("Error deleting tenant:", error)
      toast({
        title: "Error",
        description: "Failed to delete tenant. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTenant = async (data: TenantUpdateFormData) => {
    if (!selectedTenant) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tenants/${selectedTenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update tenant")
      }
      
      toast({
        title: "Success",
        description: "Tenant updated successfully!",
      })
      
      setEditDialogOpen(false)
      setSelectedTenant(null)
      fetchTenants()
    } catch (error) {
      console.error("Error updating tenant:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update tenant. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendEmail = (tenant: Tenant) => {
    if (tenant.email) {
      window.location.href = `mailto:${tenant.email}`
    } else {
      toast({
        title: "No Email",
        description: "This tenant doesn't have an email address on file.",
        variant: "destructive",
      })
    }
  }

  const handleCall = (tenant: Tenant) => {
    if (tenant.phone) {
      window.location.href = `tel:${tenant.phone}`
    } else {
      toast({
        title: "No Phone",
        description: "This tenant doesn't have a phone number on file.",
        variant: "destructive",
      })
    }
  }

  // Calculate stats
  const totalRevenue = tenants.reduce(
    (sum, t) => sum + parseFloat(t.lease?.baseRent || "0"),
    0
  )
  const avgSatisfaction = tenants.length > 0
    ? tenants.reduce((sum, t) => sum + parseFloat(t.satisfactionScore || "0"), 0) / tenants.length
    : 0
  const atRiskCount = tenants.filter((t) => parseFloat(t.riskScore || "0") > 0.3).length

  // Helper function to format phone input (restrict to 10 digits)
  const handlePhoneInput = (value: string, onChange: (val: string) => void) => {
    // Remove all non-digits except + at the start
    let cleaned = value.replace(/[^\d+]/g, "")
    // If starts with +91, keep it, otherwise just keep digits
    if (cleaned.startsWith("+91")) {
      cleaned = "+91" + cleaned.slice(3).replace(/\D/g, "").slice(0, 10)
    } else {
      cleaned = cleaned.replace(/\D/g, "").slice(0, 10)
    }
    onChange(cleaned)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage tenant relationships and monitor performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTenants} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) createForm.reset()
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleSubmit)}>
                  <DialogHeader>
                    <DialogTitle>Add New Tenant</DialogTitle>
                    <DialogDescription>
                      Enter comprehensive tenant details for onboarding.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="basic" className="mt-4">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="contact">Contact</TabsTrigger>
                      <TabsTrigger value="tax">Tax & Compliance</TabsTrigger>
                      <TabsTrigger value="bank">Banking</TabsTrigger>
                      <TabsTrigger value="address">Address</TabsTrigger>
                    </TabsList>

                    {/* Basic Tab */}
                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <FormField
                        control={createForm.control}
                        name="propertyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select property" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {properties.map((property) => (
                                  <SelectItem key={property.id} value={property.id}>
                                    {property.name} ({property.city})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter business name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="legalEntityName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Legal Entity Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Registered company name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="brandName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Trading brand name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="fashion">Fashion</SelectItem>
                                  <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                                  <SelectItem value="electronics">Electronics</SelectItem>
                                  <SelectItem value="entertainment">Entertainment</SelectItem>
                                  <SelectItem value="services">Services</SelectItem>
                                  <SelectItem value="health_beauty">Health & Beauty</SelectItem>
                                  <SelectItem value="home_lifestyle">Home & Lifestyle</SelectItem>
                                  <SelectItem value="jewelry">Jewelry</SelectItem>
                                  <SelectItem value="sports">Sports</SelectItem>
                                  <SelectItem value="books_stationery">Books & Stationery</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="businessType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                                  <SelectItem value="partnership">Partnership</SelectItem>
                                  <SelectItem value="llp">LLP</SelectItem>
                                  <SelectItem value="pvt_ltd">Private Limited</SelectItem>
                                  <SelectItem value="public_ltd">Public Limited</SelectItem>
                                  <SelectItem value="opc">One Person Company</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="onboarding">Onboarding</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Contact Tab */}
                    <TabsContent value="contact" className="space-y-4 mt-4">
                      <p className="text-sm text-muted-foreground font-medium">Primary Contact</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Person</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="designation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Designation</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Store Manager" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="10-digit mobile" {...field} onChange={(e) => handlePhoneInput(e.target.value, field.onChange)} maxLength={13} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createForm.control}
                        name="alternatePhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alternate Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="10-digit mobile" {...field} onChange={(e) => handlePhoneInput(e.target.value, field.onChange)} maxLength={13} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <p className="text-sm text-muted-foreground font-medium pt-4">Authorized Signatory</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="authorizedSignatory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Signatory Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="signatoryPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Signatory Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="10-digit mobile" {...field} onChange={(e) => handlePhoneInput(e.target.value, field.onChange)} maxLength={13} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createForm.control}
                        name="signatoryEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Signatory Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <p className="text-sm text-muted-foreground font-medium pt-4">Emergency Contact</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="emergencyContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="emergencyContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="10-digit mobile" {...field} onChange={(e) => handlePhoneInput(e.target.value, field.onChange)} maxLength={13} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* Tax & Compliance Tab */}
                    <TabsContent value="tax" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="gstin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GSTIN</FormLabel>
                              <FormControl>
                                <Input placeholder="15-character GSTIN" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} maxLength={15} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="pan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PAN</FormLabel>
                              <FormControl>
                                <Input placeholder="10-character PAN" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} maxLength={10} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="tan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>TAN</FormLabel>
                              <FormControl>
                                <Input placeholder="10-character TAN" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} maxLength={10} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="cin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CIN</FormLabel>
                              <FormControl>
                                <Input placeholder="21-character CIN" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} maxLength={21} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="fssaiLicense"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>FSSAI License</FormLabel>
                              <FormControl>
                                <Input placeholder="For F&B businesses" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="tradeLicense"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trade License</FormLabel>
                              <FormControl>
                                <Input placeholder="Trade license number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createForm.control}
                        name="shopEstablishmentNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shop & Establishment Number</FormLabel>
                            <FormControl>
                              <Input placeholder="S&E registration number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Banking Tab */}
                    <TabsContent value="bank" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="bankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., HDFC Bank" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="bankBranch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Branch</FormLabel>
                              <FormControl>
                                <Input placeholder="Branch name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="accountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Bank account number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="ifscCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>IFSC Code</FormLabel>
                              <FormControl>
                                <Input placeholder="11-character IFSC" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} maxLength={11} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createForm.control}
                        name="accountHolderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Holder Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Name as per bank records" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Address Tab */}
                    <TabsContent value="address" className="space-y-4 mt-4">
                      <FormField
                        control={createForm.control}
                        name="registeredAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registered Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Full address" {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={createForm.control}
                          name="registeredCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="City" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="registeredState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="State" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="registeredPincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PIN Code</FormLabel>
                              <FormControl>
                                <Input placeholder="6-digit PIN" {...field} maxLength={6} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Additional notes or comments..." {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Tenant
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">
              {tenants.filter((t) => t.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-green-600">From active leases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}/5</div>
            <p className="text-xs text-green-600">Based on surveys</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atRiskCount}</div>
            <p className="text-xs text-red-600">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tenant Directory</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="food_beverage">F&B</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
          ) : filteredTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No tenants found</h3>
              <p className="text-muted-foreground">
                {tenants.length === 0
                  ? "Add your first tenant to get started"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Satisfaction</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => {
                  const risk = getRiskBadge(tenant.riskScore)
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {tenant.businessName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{tenant.businessName}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{tenant.contactPerson || "No contact"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.lease ? (
                          <>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{tenant.lease.unitNumber}</span>
                              <span className="text-muted-foreground text-xs">
                                (Floor {tenant.lease.floor || "G"})
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tenant.lease.areaSqft} sq.ft
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">No lease</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={categoryColors[tenant.category || ""] || ""}
                        >
                          {getCategoryLabel(tenant.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(tenant.lease?.baseRent || "0")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={getSentimentColor(tenant.sentimentScore)}>
                            {tenant.sentimentScore
                              ? `${(parseFloat(tenant.sentimentScore) * 100).toFixed(0)}%`
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={risk.variant}>{risk.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {tenant.satisfactionScore
                              ? parseFloat(tenant.satisfactionScore).toFixed(1)
                              : "N/A"}
                          </span>
                          {tenant.satisfactionScore && (
                            <span className="text-muted-foreground">/5</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild title="Chat with tenant">
                            <Link href={`/portal?tenantId=${tenant.id}`}>
                              <MessageSquare className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="View lease"
                            onClick={() => {
                              if (tenant.lease) {
                                router.push(`/financials?leaseId=${tenant.lease.id}`)
                              } else {
                                toast({
                                  title: "No Lease",
                                  description: "This tenant doesn't have an active lease.",
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewTenant(tenant)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditTenant(tenant)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Tenant
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSendEmail(tenant)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCall(tenant)}>
                                <Phone className="h-4 w-4 mr-2" />
                                Call Tenant
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/financials?tenantId=${tenant.id}`}>
                                  <FileBarChart className="h-4 w-4 mr-2" />
                                  View Invoices
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/work-orders?tenantId=${tenant.id}`}>
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  View Work Orders
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTenant(tenant)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Tenant
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Tenant Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedTenant?.businessName}
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedTenant.businessName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedTenant.businessName}</h3>
                  {selectedTenant.legalEntityName && (
                    <p className="text-sm text-muted-foreground">{selectedTenant.legalEntityName}</p>
                  )}
                  <Badge variant={selectedTenant.status === "active" ? "default" : "secondary"}>
                    {selectedTenant.status || "Unknown"}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                  <p className="text-sm">{selectedTenant.contactPerson || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-sm">{getCategoryLabel(selectedTenant.category)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{selectedTenant.email || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm">{selectedTenant.phone || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">GSTIN</label>
                  <p className="text-sm">{selectedTenant.gstin || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Risk Score</label>
                  <p className="text-sm">
                    <Badge variant={getRiskBadge(selectedTenant.riskScore).variant}>
                      {getRiskBadge(selectedTenant.riskScore).label}
                    </Badge>
                  </p>
                </div>
              </div>

              {selectedTenant.lease && (
                <>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Lease Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Unit</label>
                        <p className="text-sm">{selectedTenant.lease.unitNumber} (Floor {selectedTenant.lease.floor || "G"})</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Area</label>
                        <p className="text-sm">{selectedTenant.lease.areaSqft} sq.ft</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Base Rent</label>
                        <p className="text-sm">{formatCurrency(selectedTenant.lease.baseRent || "0")}/month</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Lease Period</label>
                        <p className="text-sm">
                          {new Date(selectedTenant.lease.startDate).toLocaleDateString()} - {new Date(selectedTenant.lease.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false)
              if (selectedTenant) handleEditTenant(selectedTenant)
            }}>
              Edit Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) {
          editForm.reset()
          setSelectedTenant(null)
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateTenant)}>
              <DialogHeader>
                <DialogTitle>Edit Tenant</DialogTitle>
                <DialogDescription>
                  Update the tenant information for {selectedTenant?.businessName}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField
                  control={editForm.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter business name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fashion">Fashion</SelectItem>
                          <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="10-digit mobile"
                            {...field}
                            onChange={(e) => handlePhoneInput(e.target.value, field.onChange)}
                            maxLength={13}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="15-character GSTIN"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTenant?.businessName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTenant}>
              Delete Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
