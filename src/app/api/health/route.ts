/**
 * Health Check API Route
 * 
 * Checks the health of various services including:
 * - Database (Neon PostgreSQL)
 * - Cache (Upstash Redis)
 * - Application status
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { isRedisHealthy, isRedisAvailable } from "@/lib/cache"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  version: string
  services: {
    database: ServiceStatus
    cache: ServiceStatus
    application: ServiceStatus
  }
  uptime: number
}

interface ServiceStatus {
  status: "up" | "down" | "degraded"
  latency?: number
  message?: string
}

const startTime = Date.now()

export async function GET() {
  const healthStatus: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    services: {
      database: { status: "down" },
      cache: { status: "down" },
      application: { status: "up" },
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  }

  // Check database health
  try {
    const dbStart = Date.now()
    await db.execute(sql`SELECT 1`)
    healthStatus.services.database = {
      status: "up",
      latency: Date.now() - dbStart,
      message: "PostgreSQL connection successful",
    }
  } catch (error) {
    healthStatus.services.database = {
      status: "down",
      message: error instanceof Error ? error.message : "Database connection failed",
    }
    healthStatus.status = "degraded"
  }

  // Check Redis cache health
  try {
    if (!isRedisAvailable()) {
      healthStatus.services.cache = {
        status: "down",
        message: "Redis not configured - set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
      }
      // Cache not being configured is degraded, not unhealthy
      healthStatus.status = "degraded"
    } else {
      const cacheStart = Date.now()
      const redisHealthy = await isRedisHealthy()
      if (redisHealthy) {
        healthStatus.services.cache = {
          status: "up",
          latency: Date.now() - cacheStart,
          message: "Redis connection successful",
        }
      } else {
        healthStatus.services.cache = {
          status: "down",
          message: "Redis ping failed",
        }
        healthStatus.status = "degraded"
      }
    }
  } catch (error) {
    healthStatus.services.cache = {
      status: "down",
      message: error instanceof Error ? error.message : "Redis connection failed",
    }
    // Cache being down is degraded, not unhealthy
    if (healthStatus.status === "healthy") {
      healthStatus.status = "degraded"
    }
  }

  // Determine overall health status
  const allServicesUp = Object.values(healthStatus.services).every(
    (service) => service.status === "up"
  )
  const anyServiceDown = Object.values(healthStatus.services).some(
    (service) => service.status === "down"
  )

  if (allServicesUp) {
    healthStatus.status = "healthy"
  } else if (anyServiceDown && healthStatus.services.database.status === "down") {
    healthStatus.status = "unhealthy"
  } else {
    healthStatus.status = "degraded"
  }

  const statusCode = healthStatus.status === "unhealthy" ? 503 : 200

  return NextResponse.json(healthStatus, { status: statusCode })
}

