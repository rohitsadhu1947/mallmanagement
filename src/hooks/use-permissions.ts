"use client"

import { useSession } from "next-auth/react"
import { useMemo } from "react"
import { PERMISSIONS, ROLE_PERMISSIONS, Permission } from "@/lib/auth/permissions"

export function usePermissions() {
  const { data: session, status } = useSession()

  const permissions = useMemo(() => {
    if (!session?.user) return []
    const userRole = session.user.role || "viewer"
    return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.viewer
  }, [session?.user])

  const hasPermission = useMemo(() => {
    return (permission: Permission): boolean => {
      return permissions.includes(permission)
    }
  }, [permissions])

  const hasAnyPermission = useMemo(() => {
    return (permissionList: Permission[]): boolean => {
      return permissionList.some((p) => permissions.includes(p))
    }
  }, [permissions])

  const hasAllPermissions = useMemo(() => {
    return (permissionList: Permission[]): boolean => {
      return permissionList.every((p) => permissions.includes(p))
    }
  }, [permissions])

  const isAdmin = useMemo(() => {
    return (
      session?.user?.role === "super_admin" ||
      session?.user?.role === "organization_admin"
    )
  }, [session?.user?.role])

  const isSuperAdmin = useMemo(() => {
    return session?.user?.role === "super_admin"
  }, [session?.user?.role])

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSuperAdmin,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    user: session?.user,
  }
}

// Export PERMISSIONS for easy access in components
export { PERMISSIONS }
export type { Permission }

