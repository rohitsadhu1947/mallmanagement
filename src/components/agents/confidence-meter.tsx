"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ConfidenceMeterProps {
  confidence: number // 0 to 1
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function ConfidenceMeter({
  confidence,
  size = "sm",
  showLabel = true,
}: ConfidenceMeterProps) {
  const percentage = Math.round(confidence * 100)

  const getColor = () => {
    if (confidence >= 0.8) return "bg-green-500"
    if (confidence >= 0.6) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getTextColor = () => {
    if (confidence >= 0.8) return "text-green-700"
    if (confidence >= 0.6) return "text-yellow-700"
    return "text-red-700"
  }

  const sizeClasses = {
    sm: "h-1.5 w-16",
    md: "h-2 w-24",
    lg: "h-2.5 w-32",
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "overflow-hidden rounded-full bg-gray-200",
          sizeClasses[size]
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", getTextColor())}>
          {percentage}%
        </span>
      )}
    </div>
  )
}

