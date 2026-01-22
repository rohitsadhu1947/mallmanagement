import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, roles, organizations } from "@/lib/db/schema"
import { eq, desc, and, ilike, or } from "drizzle-orm"
import { requirePermission, PERMISSIONS } from "@/lib/auth/rbac"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    const { authorized, error } = await requirePermission(PERMISSIONS.USERS_VIEW)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const roleId = searchParams.get("roleId")
    const organizationId = searchParams.get("organizationId")

    // Build query conditions
    const conditions = []
    
    // Non-super admins can only see users in their organization
    if (session.user.role !== "super_admin" && session.user.organizationId) {
      conditions.push(eq(users.organizationId, session.user.organizationId))
    }

    if (status) {
      conditions.push(eq(users.status, status))
    }

    if (roleId) {
      conditions.push(eq(users.roleId, roleId))
    }

    if (organizationId && session.user.role === "super_admin") {
      conditions.push(eq(users.organizationId, organizationId))
    }

    const usersWithRoles = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        status: users.status,
        properties: users.properties,
        preferences: users.preferences,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))

    // Filter by search query if provided
    let result = usersWithRoles
    if (search) {
      const searchLower = search.toLowerCase()
      result = usersWithRoles.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.role?.name?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get users error:", error)
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

    // Check permission
    const { authorized, error } = await requirePermission(PERMISSIONS.USERS_CREATE)
    if (!authorized) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, phone, password, roleId, organizationId, properties, status } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password if provided
    let hashedPassword = null
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // Non-super admins can only create users in their own organization
    let finalOrganizationId = organizationId
    if (session.user.role !== "super_admin") {
      finalOrganizationId = session.user.organizationId
    }

    const userId = crypto.randomUUID()
    await db.insert(users).values({
      id: userId,
      email,
      name,
      phone,
      password: hashedPassword,
      roleId,
      organizationId: finalOrganizationId,
      properties: properties || [],
      status: status || "active",
    })

    const newUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser!

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

