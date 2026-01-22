import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { roles } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { requirePermission, PERMISSIONS, ROLE_PERMISSIONS, Permission } from "@/lib/auth/rbac"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // All authenticated users can view roles list
    const allRoles = await db
      .select()
      .from(roles)
      .orderBy(desc(roles.createdAt))

    // If no custom roles in DB, return default roles
    if (allRoles.length === 0) {
      const defaultRoles = Object.entries(ROLE_PERMISSIONS).map(([name, permissions]) => ({
        id: name,
        name,
        description: getRoleDescription(name),
        permissions,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
      return NextResponse.json(defaultRoles)
    }

    return NextResponse.json(allRoles)
  } catch (error) {
    console.error("Get roles error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can create roles
    if (session.user.role !== "super_admin" && session.user.role !== "organization_admin") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can create roles" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, permissions } = body

    if (!name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      )
    }

    // Check if role already exists
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.name, name),
    })

    if (existingRole) {
      return NextResponse.json(
        { error: "Role with this name already exists" },
        { status: 409 }
      )
    }

    // Validate permissions
    const validPermissions = permissions?.filter((p: string) => 
      Object.values(PERMISSIONS).includes(p as Permission)
    ) || []

    const roleId = crypto.randomUUID()
    await db.insert(roles).values({
      id: roleId,
      name,
      description,
      permissions: validPermissions,
    })

    const newRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    })

    return NextResponse.json(newRole, { status: 201 })
  } catch (error) {
    console.error("Create role error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function getRoleDescription(roleName: string): string {
  const descriptions: Record<string, string> = {
    super_admin: "Full system access with all permissions",
    organization_admin: "Organization-level administration with user management",
    property_manager: "Manage properties, tenants, and daily operations",
    accountant: "Financial operations including invoicing and reporting",
    maintenance_staff: "Work order management and maintenance tasks",
    tenant_user: "Limited access for tenant self-service portal",
    viewer: "Read-only access to view data without modifications",
  }
  return descriptions[roleName] || "Custom role"
}

