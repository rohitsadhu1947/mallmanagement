import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { roles, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { PERMISSIONS, Permission, ROLE_PERMISSIONS } from "@/lib/auth/rbac"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roleId = params.id

    // Check if it's a default role
    if (ROLE_PERMISSIONS[roleId]) {
      return NextResponse.json({
        id: roleId,
        name: roleId,
        description: getRoleDescription(roleId),
        permissions: ROLE_PERMISSIONS[roleId],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error("Get role by ID error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can edit roles
    if (session.user.role !== "super_admin" && session.user.role !== "organization_admin") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can edit roles" },
        { status: 403 }
      )
    }

    const roleId = params.id
    const body = await request.json()
    const { name, description, permissions } = body

    // Prevent editing default roles (they're hardcoded)
    if (ROLE_PERMISSIONS[roleId]) {
      return NextResponse.json(
        { error: "Cannot edit default system roles" },
        { status: 400 }
      )
    }

    // Get existing role
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    })

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Validate permissions
    const validPermissions = permissions?.filter((p: string) => 
      Object.values(PERMISSIONS).includes(p as Permission)
    )

    const [updatedRole] = await db
      .update(roles)
      .set({
        name: name || existingRole.name,
        description: description !== undefined ? description : existingRole.description,
        permissions: validPermissions !== undefined ? validPermissions : existingRole.permissions,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, roleId))
      .returning()

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error("Update role error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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

    // Only super_admin can delete roles
    if (session.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden: Only super admins can delete roles" },
        { status: 403 }
      )
    }

    const roleId = params.id

    // Prevent deleting default roles
    if (ROLE_PERMISSIONS[roleId]) {
      return NextResponse.json(
        { error: "Cannot delete default system roles" },
        { status: 400 }
      )
    }

    // Check if any users are using this role
    const usersWithRole = await db.query.users.findFirst({
      where: eq(users.roleId, roleId),
    })

    if (usersWithRole) {
      return NextResponse.json(
        { error: "Cannot delete role that is assigned to users. Reassign users first." },
        { status: 400 }
      )
    }

    await db.delete(roles).where(eq(roles.id, roleId))

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("Delete role error:", error)
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

