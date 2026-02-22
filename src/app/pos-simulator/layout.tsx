import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "POS Terminal Simulator | MallOS",
  description: "Simulated POS terminal for tenant sales entry",
}

export default function POSSimulatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {children}
    </div>
  )
}
