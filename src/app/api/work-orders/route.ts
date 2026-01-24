import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { workOrders, tenants } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { getCachedOrFetch, CACHE_KEYS, CACHE_TTL, invalidateEntityCache } from "@/lib/cache"
import { PERMISSIONS, requirePermission } from "@/lib/auth/rbac"

export async function GET(request: NextRequest) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.WORK_ORDERS_VIEW)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")
    const tenantId = searchParams.get("tenantId")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const refresh = searchParams.get("refresh") === "true"

    // Cache key based on filters
    const cacheKey = propertyId 
      ? CACHE_KEYS.WORK_ORDER_LIST(propertyId)
      : `workorders:list:all:${tenantId || "all"}:${status || "all"}:${priority || "all"}`

    // Invalidate cache if refresh requested
    if (refresh && propertyId) {
      await invalidateEntityCache("workorder", propertyId, propertyId)
    }

    const result = await getCachedOrFetch(
      cacheKey,
      async () => {
        const workOrdersWithTenants = await db
          .select({
            workOrder: workOrders,
            tenant: tenants,
          })
          .from(workOrders)
          .leftJoin(tenants, eq(workOrders.tenantId, tenants.id))
          .where(
            and(
              propertyId ? eq(workOrders.propertyId, propertyId) : undefined,
              tenantId ? eq(workOrders.tenantId, tenantId) : undefined,
              status ? eq(workOrders.status, status) : undefined,
              priority ? eq(workOrders.priority, priority) : undefined
            )
          )
          .orderBy(desc(workOrders.createdAt))

        return workOrdersWithTenants.map(({ workOrder, tenant }) => ({
          ...workOrder,
          tenant: tenant
            ? {
                id: tenant.id,
                businessName: tenant.businessName,
                contactPerson: tenant.contactPerson,
              }
            : null,
        }))
      },
      CACHE_TTL.SHORT // 1 minute for work orders (more real-time)
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Get work orders error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, error } = await requirePermission(PERMISSIONS.WORK_ORDERS_CREATE)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      propertyId,
      tenantId,
      category,
      priority,
      title,
      description,
      location,
    } = body

    if (!propertyId || !title || !category) {
      return NextResponse.json(
        { error: "Property ID, title, and category are required" },
        { status: 400 }
      )
    }

    const workOrderId = crypto.randomUUID()
    const workOrderNumber = `WO-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, "0")}`

    await db.insert(workOrders).values({
      propertyId,
      tenantId,
      workOrderNumber,
      category,
      priority: priority || "medium",
      title,
      description,
      location,
      status: "open",
      createdBy: session.user.id,
    })

    const newWorkOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
    })

    // Invalidate work order list cache
    await invalidateEntityCache("workorder", workOrderId, propertyId)

    return NextResponse.json({ success: true, data: newWorkOrder }, { status: 201 })
  } catch (error) {
    console.error("Create work order error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

