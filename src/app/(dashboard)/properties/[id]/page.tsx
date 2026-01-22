"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Building2,
  MapPin,
  Users,
  Ruler,
  DollarSign,
  Footprints,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Edit,
  Settings,
  BarChart3,
  Wrench,
  FileText,
  Calendar,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle,
  Clock,
  Loader2,
  Plus,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { tenantSchema, type TenantFormData } from "@/lib/validations/tenant"

interface PropertyDetails {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  pincode: string | null
  type: string
  totalAreaSqft: number
  leasableAreaSqft: number
  floors: number
  status: string
  zones: string[]
  operatingHours: { openingTime?: string; closingTime?: string; operatingDays?: string[] } | null
  amenities: string[]
  metadata: { propertyManager?: { name?: string; phone?: string; email?: string } } | null
  tenantCount: number
  activeLeases: number
  occupancyRate: number
  collectionRate: number
  monthlyRevenue: number
  footTraffic: number
  createdAt: string
  updatedAt: string
}

interface Tenant {
  id: string
  businessName: string
  category: string
  contactPerson: string | null
  email: string | null
  phone: string | null
  status: string
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Error Loading Property</h2>
      <p className="text-muted-foreground mb-4">{message}</p>
      <Button onClick={onRetry} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}

export default function PropertyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [property, setProperty] = React.useState<PropertyDetails | null>(null)
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [addTenantOpen, setAddTenantOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const propertyId = params.id as string

  // Form for adding tenant
  const tenantForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      businessName: "",
      legalEntityName: "",
      category: undefined,
      contactPerson: "",
      email: "",
      phone: "",
      gstin: "",
      propertyId: propertyId,
      status: "active",
    },
  })

  // Reset form with propertyId when dialog opens
  React.useEffect(() => {
    if (addTenantOpen && propertyId) {
      tenantForm.setValue("propertyId", propertyId)
    }
  }, [addTenantOpen, propertyId, tenantForm])

  // Handle add tenant submit
  const handleAddTenant = async (data: TenantFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          propertyId: propertyId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create tenant")
      }

      toast({
        title: "Success",
        description: "Tenant added successfully!",
      })

      setAddTenantOpen(false)
      tenantForm.reset()
      // Refresh tenants list
      fetchPropertyData()
    } catch (error) {
      console.error("Error adding tenant:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add tenant",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchPropertyData = React.useCallback(async () => {
    if (!propertyId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch property details
      const propertyResponse = await fetch(`/api/properties/${propertyId}`)
      const propertyData = await propertyResponse.json()

      if (!propertyResponse.ok) {
        throw new Error(propertyData.error || "Failed to fetch property")
      }

      setProperty(propertyData.data)

      // Fetch tenants for this property
      const tenantsResponse = await fetch(`/api/tenants?propertyId=${propertyId}`)
      const tenantsData = await tenantsResponse.json()

      if (tenantsResponse.ok && tenantsData.data) {
        setTenants(tenantsData.data)
      }
    } catch (err) {
      console.error("Error fetching property:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  React.useEffect(() => {
    fetchPropertyData()
  }, [fetchPropertyData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchPropertyData()
    setIsRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Property data has been updated.",
    })
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !property) {
    return <ErrorState message={error || "Property not found"} onRetry={fetchPropertyData} />
  }

  const operatingHours = property.operatingHours || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
              <Badge variant={property.status === "active" ? "default" : "secondary"}>
                {property.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {[property.address, property.city, property.state].filter(Boolean).join(", ") || "Address not specified"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => router.push(`/properties`)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Ruler className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Area</p>
                <p className="text-lg font-bold">
                  {property.totalAreaSqft > 0 ? `${property.totalAreaSqft.toLocaleString()} sq.ft` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tenants</p>
                <p className="text-lg font-bold">{property.tenantCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Occupancy</p>
                <p className="text-lg font-bold">{property.occupancyRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                <p className="text-lg font-bold">
                  {property.monthlyRevenue > 0 ? formatCurrency(property.monthlyRevenue) : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                <Footprints className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily Footfall</p>
                <p className="text-lg font-bold">
                  {property.footTraffic > 0 ? property.footTraffic.toLocaleString() : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Building2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tenants" className="gap-2">
            <Users className="h-4 w-4" />
            Tenants ({property.tenantCount})
          </TabsTrigger>
          <TabsTrigger value="financials" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Property Code</p>
                    <p className="font-medium">{property.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{property.type?.replace("_", " ") || "Mall"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Floors</p>
                    <p className="font-medium">{property.floors || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Leasable Area</p>
                    <p className="font-medium">
                      {property.leasableAreaSqft > 0 ? `${property.leasableAreaSqft.toLocaleString()} sq.ft` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PIN Code</p>
                    <p className="font-medium">{property.pincode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-medium">{property.country || "India"}</p>
                  </div>
                </div>
                
                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline">{amenity}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {property.zones && property.zones.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Zones</p>
                    <div className="flex flex-wrap gap-2">
                      {property.zones.map((zone) => (
                        <Badge key={zone} variant="secondary">{zone}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Operating Hours</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {operatingHours.openingTime && operatingHours.closingTime 
                      ? `${operatingHours.openingTime} - ${operatingHours.closingTime}`
                      : "Not specified"}
                  </p>
                  {operatingHours.operatingDays && operatingHours.operatingDays.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {operatingHours.operatingDays.join(", ")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{property.occupancyRate}%</span>
                      {property.occupancyRate >= 80 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full transition-all",
                        property.occupancyRate >= 80 ? "bg-emerald-500" : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(property.occupancyRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Collection Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{property.collectionRate}%</span>
                      {property.collectionRate >= 90 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full transition-all",
                        property.collectionRate >= 90 ? "bg-blue-500" : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(property.collectionRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Leases</span>
                    <span className="font-semibold">{property.activeLeases} / {property.tenantCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Manager Contact */}
            {property.metadata?.propertyManager && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Property Manager</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6">
                    {property.metadata.propertyManager.name && (
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{property.metadata.propertyManager.name}</p>
                      </div>
                    )}
                    {property.metadata.propertyManager.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <a 
                          href={`tel:${property.metadata.propertyManager.phone}`}
                          className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {property.metadata.propertyManager.phone}
                        </a>
                      </div>
                    )}
                    {property.metadata.propertyManager.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <a 
                          href={`mailto:${property.metadata.propertyManager.email}`}
                          className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {property.metadata.propertyManager.email}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tenants ({tenants.length})</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    className="gap-2 bg-emerald-500 hover:bg-emerald-600" 
                    onClick={() => setAddTenantOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Tenant
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => router.push("/tenants")}>
                    <Users className="h-4 w-4" />
                    Manage All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tenants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Tenants Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    This property doesn&apos;t have any tenants registered yet.
                  </p>
                  <Button 
                    className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => setAddTenantOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add First Tenant
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.businessName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {tenant.category?.replace("_", " ") || "Other"}
                          </Badge>
                        </TableCell>
                        <TableCell>{tenant.contactPerson || "-"}</TableCell>
                        <TableCell>
                          {tenant.email ? (
                            <a href={`mailto:${tenant.email}`} className="text-blue-600 hover:underline">
                              {tenant.email}
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {tenant.phone ? (
                            <a href={`tel:${tenant.phone}`} className="text-blue-600 hover:underline">
                              {tenant.phone}
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
                            {tenant.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Financial Dashboard</h3>
                <p className="text-muted-foreground mb-4">Property-level financial analytics</p>
                <Button variant="outline" onClick={() => router.push("/financials")}>
                  View Financials
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Wrench className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Maintenance Dashboard</h3>
                <p className="text-muted-foreground mb-4">Property-level maintenance tracking</p>
                <Button variant="outline" onClick={() => router.push("/work-orders")}>
                  View Work Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Property Analytics</h3>
                <p className="text-muted-foreground mb-4">Detailed property analytics</p>
                <Button variant="outline" onClick={() => router.push("/analytics")}>
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Tenant Dialog */}
      <Dialog open={addTenantOpen} onOpenChange={setAddTenantOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <Form {...tenantForm}>
            <form onSubmit={tenantForm.handleSubmit(handleAddTenant)}>
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
                <DialogDescription>
                  Add a new tenant to {property?.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <FormField
                  control={tenantForm.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lifestyle Fashion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={tenantForm.control}
                  name="legalEntityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Entity Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lifestyle International Pvt Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={tenantForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fashion">Fashion & Apparel</SelectItem>
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
                    control={tenantForm.control}
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
                    control={tenantForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="10-digit mobile" 
                            maxLength={10}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={tenantForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="business@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={tenantForm.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl>
                        <Input placeholder="15-character GST number" maxLength={15} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setAddTenantOpen(false)
                    tenantForm.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Tenant
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
