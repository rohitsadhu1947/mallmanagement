import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { vendors } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { PERMISSIONS, requirePermission } from "@/lib/auth/rbac"
import { z } from "zod"

const createVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  bankDetails: z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    ifscCode: z.string().optional(),
  }).optional().nullable(),
  contractExpiry: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const { authorized, error } = await requirePermission(PERMISSIONS.VENDORS_VIEW)
  if (!authorized) {
    return NextResponse.json({ error }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId") || session.user.organizationId
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
    }

    const allVendors = await db.query.vendors.findMany({
      where: eq(vendors.organizationId, organizationId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    })

    // Filter on application level
    let filtered = allVendors
    if (category) {
      filtered = filtered.filter(v => v.category === category)
    }
    if (status) {
      filtered = filtered.filter(v => v.status === status)
    }

    return NextResponse.json(filtered)
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { authorized, error } = await requirePermission(PERMISSIONS.VENDORS_CREATE)
  if (!authorized) {
    return NextResponse.json({ error }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = createVendorSchema.parse(body)

    const newVendor = await db.insert(vendors).values({
      id: crypto.randomUUID(),
      organizationId: session.user.organizationId!,
      name: validatedData.name,
      category: validatedData.category,
      contactPerson: validatedData.contactPerson || null,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      address: validatedData.address || null,
      gstNumber: validatedData.gstNumber || null,
      panNumber: validatedData.panNumber || null,
      bankDetails: validatedData.bankDetails || null,
      performanceRating: 0,
      totalWorkOrders: 0,
      completedWorkOrders: 0,
      avgResponseTime: null,
      avgCompletionTime: null,
      totalAmountPaid: 0,
      status: "pending",
      contractExpiry: validatedData.contractExpiry ? new Date(validatedData.contractExpiry) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    return NextResponse.json(newVendor[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating vendor:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

