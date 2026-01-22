import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tenant Portal - Mall Management",
  description: "Tenant portal for mall management platform",
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {children}
    </div>
  )
}

