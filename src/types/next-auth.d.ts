import "next-auth"
import type { UserRole } from "@/lib/auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    organizationId: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      organizationId: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    organizationId: string
  }
}

