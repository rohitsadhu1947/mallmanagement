import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { equipment } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { PERMISSIONS, requirePermission } from "@/lib/auth/rbac"
import { z } from "zod"

const createEquipmentSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  installationDate: z.string().optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  maintenanceFrequencyDays: z.number().int().positive().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const { authorized, error } = await requirePermission(PERMISSIONS.EQUIPMENT_VIEW)
  if (!authorized) {
    return NextResponse.json({ error }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")
    const type = searchParams.get("type")
    const status = searchParams.get("status")

    const allEquipment = await db.query.equipment.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    })

    // Filter on application level
    let filtered = allEquipment
    if (propertyId) {
      filtered = filtered.filter(e => e.propertyId === propertyId)
    }
    if (type) {
      filtered = filtered.filter(e => e.type === type)
    }
    if (status) {
      filtered = filtered.filter(e => e.status === status)
    }

    return NextResponse.json(filtered)
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { authorized, error } = await requirePermission(PERMISSIONS.EQUIPMENT_CREATE)
  if (!authorized) {
    return NextResponse.json({ error }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = createEquipmentSchema.parse(body)

    // Calculate next maintenance date
    let nextMaintenanceDate: Date | null = null
    if (validatedData.maintenanceFrequencyDays && validatedData.installationDate) {
      nextMaintenanceDate = new Date(validatedData.installationDate)
      nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + validatedData.maintenanceFrequencyDays)
    }

    const newEquipment = await db.insert(equipment).values({
      propertyId: validatedData.propertyId,
      name: validatedData.name,
      type: validatedData.type,
      make: validatedData.make || null,
      model: validatedData.model || null,
      serialNumber: validatedData.serialNumber || null,
      location: validatedData.location || null,
      installationDate: validatedData.installationDate || null,
      warrantyExpiry: validatedData.warrantyExpiry || null,
      maintenanceFrequencyDays: validatedData.maintenanceFrequencyDays || null,
      lastMaintenanceDate: null,
      nextMaintenanceDate: nextMaintenanceDate?.toISOString().split("T")[0] || null,
      predictedFailureDate: null,
      predictionConfidence: null,
      healthScore: "1.00",
      status: "operational",
    }).returning()

    return NextResponse.json(newEquipment[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating equipment:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

