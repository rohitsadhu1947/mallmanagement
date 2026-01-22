"use client"

import React from "react"
import { usePermissions, Permission, PERMISSIONS } from "@/hooks/use-permissions"
import { AlertTriangle, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface PermissionGateProps {
  children: React.ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showAccessDenied?: boolean
}

/**
 * PermissionGate component that conditionally renders children based on user permissions.
 * 
 * Usage:
 * 
 * // Single permission
 * <PermissionGate permission={PERMISSIONS.USERS_VIEW}>
 *   <UsersList />
 * </PermissionGate>
 * 
 * // Multiple permissions (any)
 * <PermissionGate permissions={[PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_EDIT]}>
 *   <UsersPage />
 * </PermissionGate>
 * 
 * // Multiple permissions (all required)
 * <PermissionGate 
 *   permissions={[PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_EDIT]} 
 *   requireAll
 * >
 *   <UsersEditForm />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback,
  showAccessDenied = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  } else {
    // No permissions specified, allow access
    hasAccess = true
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showAccessDenied) {
    return <AccessDenied onGoBack={() => router.back()} />
  }

  return null
}

/**
 * Higher-order component that wraps a component with permission checking
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: Permission | Permission[],
  requireAll = false
) {
  return function WithPermissionWrapper(props: P) {
    const permissionProps = Array.isArray(permission)
      ? { permissions: permission, requireAll }
      : { permission }

    return (
      <PermissionGate {...permissionProps} showAccessDenied>
        <WrappedComponent {...props} />
      </PermissionGate>
    )
  }
}

/**
 * Access Denied component shown when user lacks required permissions
 */
function AccessDenied({ onGoBack }: { onGoBack: () => void }) {
  return (
    <Card className="max-w-md mx-auto mt-12">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <Lock className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onGoBack}>
            Go Back
          </Button>
          <Button onClick={() => window.location.href = "/dashboard"}>
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Hook-based permission check for conditional rendering in components
 */
export function useCanAccess(
  permission?: Permission,
  permissions?: Permission[],
  requireAll = false
): boolean {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  if (permission) {
    return hasPermission(permission)
  }

  if (permissions && permissions.length > 0) {
    return requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  return true
}

// Re-export for convenience
export { PERMISSIONS }

