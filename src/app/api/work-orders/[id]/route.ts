import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { workOrders, tenants } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { invalidateEntityCache } from "@/lib/cache"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, params.id),
    })

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    // Get tenant info if available
    let tenant = null
    if (workOrder.tenantId) {
      tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, workOrder.tenantId),
      })
    }

    return NextResponse.json({
      ...workOrder,
      tenant: tenant ? {
        id: tenant.id,
        businessName: tenant.businessName,
        contactPerson: tenant.contactPerson,
      } : null,
    })
  } catch (error) {
    console.error("Get work order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, priority, assignedTo, notes, resolution } = body

    // Check if work order exists
    const existingWorkOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, params.id),
    })

    if (!existingWorkOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    // Build update object
    const updateData: Record<string, any> = { updatedAt: new Date() }
    
    if (status !== undefined) {
      updateData.status = status
      // If marking as resolved, set resolved timestamp
      if (status === "resolved") {
        updateData.resolvedAt = new Date()
        updateData.resolvedBy = session.user.id
      }
    }
    
    if (priority !== undefined) updateData.priority = priority
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo
      // If assigning for the first time, set assigned timestamp
      if (!existingWorkOrder.assignedTo && assignedTo) {
        updateData.assignedAt = new Date()
      }
    }
    if (notes !== undefined) updateData.notes = notes
    if (resolution !== undefined) updateData.resolution = resolution

    const [updatedWorkOrder] = await db
      .update(workOrders)
      .set(updateData)
      .where(eq(workOrders.id, params.id))
      .returning()

    // Invalidate cache
    if (existingWorkOrder.propertyId) {
      await invalidateEntityCache("workorder", params.id, existingWorkOrder.propertyId)
    }

    return NextResponse.json(updatedWorkOrder)
  } catch (error) {
    console.error("Update work order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Soft delete by setting status to cancelled
    const [deletedWorkOrder] = await db
      .update(workOrders)
      .set({ 
        status: "cancelled", 
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, params.id))
      .returning()

    if (!deletedWorkOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    // Invalidate cache
    if (deletedWorkOrder.propertyId) {
      await invalidateEntityCache("workorder", params.id, deletedWorkOrder.propertyId)
    }

    return NextResponse.json({ message: "Work order cancelled successfully" })
  } catch (error) {
    console.error("Delete work order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

