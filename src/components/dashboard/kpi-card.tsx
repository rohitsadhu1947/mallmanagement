"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  label: string
  value: number | string
  suffix?: string
  change?: number
  trend?: "up" | "down"
  icon: LucideIcon
  className?: string
}

export function KPICard({
  label,
  value,
  suffix = "",
  change,
  trend,
  icon: Icon,
  className,
}: KPICardProps) {
  const isPositive = trend === "up"
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                isPositive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </span>
            <span className="text-lg text-muted-foreground">{suffix}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

