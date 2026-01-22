import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, roles, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requirePermission, PERMISSIONS } from "@/lib/auth/rbac"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Users can view their own profile
    const userId = params.id
    if (userId !== session.user.id) {
      const { authorized, error } = await requirePermission(PERMISSIONS.USERS_VIEW)
      if (!authorized) {
        return NextResponse.json({ error }, { status: 403 })
      }
    }

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        status: users.status,
        properties: users.properties,
        preferences: users.preferences,
        image: users.image,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
          permissions: roles.permissions,
        },
        organization: {
          id: organizations.id,
          name: organizations.name,
          code: organizations.code,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.id, userId))
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check organization access for non-super admins
    if (
      session.user.role !== "super_admin" &&
      user[0].organization?.id !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(user[0])
  } catch (error) {
    console.error("Get user by ID error:", error)
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

    const userId = params.id
    
    // Users can edit their own profile (limited fields)
    const isSelf = userId === session.user.id
    if (!isSelf) {
      const { authorized, error } = await requirePermission(PERMISSIONS.USERS_EDIT)
      if (!authorized) {
        return NextResponse.json({ error }, { status: 403 })
      }
    }

    const body = await request.json()
    const { email, name, phone, password, roleId, organizationId, properties, status, preferences } = body

    // Get existing user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check organization access for non-super admins
    if (
      session.user.role !== "super_admin" &&
      existingUser.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Fields anyone can update about themselves
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (preferences !== undefined) updateData.preferences = preferences

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Fields only admins can update
    if (!isSelf) {
      if (email !== undefined) updateData.email = email
      if (roleId !== undefined) updateData.roleId = roleId
      if (properties !== undefined) updateData.properties = properties
      if (status !== undefined) updateData.status = status
      
      // Only super_admin can change organization
      if (organizationId !== undefined && session.user.role === "super_admin") {
        updateData.organizationId = organizationId
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning()

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Update user error:", error)
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

    const { authorized, error } = await requirePermission(PERMISSIONS.USERS_DELETE)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const userId = params.id

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Get user to check organization
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check organization access for non-super admins
    if (
      session.user.role !== "super_admin" &&
      existingUser.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Soft delete by setting status to inactive
    const [deletedUser] = await db
      .update(users)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    return NextResponse.json({ message: "User deactivated successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

