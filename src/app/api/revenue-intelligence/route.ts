import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leases, tenants, posIntegrations, posSalesData } from "@/lib/db/schema"
import { eq, and, gte, lte, sql, desc } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")
    const period = searchParams.get("period") || "30"
    const days = parseInt(period)

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startStr = startDate.toISOString().split("T")[0]
    const endStr = endDate.toISOString().split("T")[0]

    // Previous period for trend comparison
    const prevEndDate = new Date(startDate)
    prevEndDate.setDate(prevEndDate.getDate() - 1)
    const prevStartDate = new Date(prevEndDate)
    prevStartDate.setDate(prevStartDate.getDate() - days)
    const prevStartStr = prevStartDate.toISOString().split("T")[0]
    const prevEndStr = prevEndDate.toISOString().split("T")[0]

    // Get all revenue-share leases with tenant and POS info
    const revShareLeases = await db
      .select({
        leaseId: leases.id,
        leasePropertyId: leases.propertyId,
        tenantId: tenants.id,
        businessName: tenants.businessName,
        category: tenants.category,
        unitNumber: leases.unitNumber,
        floor: leases.floor,
        revenueSharePercentage: leases.revenueSharePercentage,
        leaseType: leases.leaseType,
        posId: posIntegrations.id,
        posProvider: posIntegrations.provider,
        posStatus: posIntegrations.status,
        posStoreId: posIntegrations.storeId,
        posLastSyncAt: posIntegrations.lastSyncAt,
      })
      .from(leases)
      .innerJoin(tenants, eq(leases.tenantId, tenants.id))
      .leftJoin(posIntegrations, eq(leases.id, posIntegrations.leaseId))
      .where(
        and(
          eq(leases.status, "active"),
          sql`${leases.leaseType} IN ('revenue_share', 'hybrid', 'minimum_guarantee')`,
          ...(propertyId ? [eq(leases.propertyId, propertyId)] : [])
        )
      )

    const connectedTenants = revShareLeases.filter((t) => t.posStatus === "connected")
    const notConnectedTenants = revShareLeases.filter((t) => !t.posId || t.posStatus !== "connected")

    // Fetch current period sales data for all connected tenants
    const tenantDataPromises = connectedTenants.map(async (tenant) => {
      // Current period sales
      const currentSales = await db
        .select({
          salesDate: posSalesData.salesDate,
          grossSales: posSalesData.grossSales,
          netSales: posSalesData.netSales,
          transactionCount: posSalesData.transactionCount,
        })
        .from(posSalesData)
        .where(
          and(
            eq(posSalesData.leaseId, tenant.leaseId),
            gte(posSalesData.salesDate, startStr),
            lte(posSalesData.salesDate, endStr)
          )
        )
        .orderBy(posSalesData.salesDate)

      // Previous period sales (for trend)
      const prevSalesResult = await db
        .select({
          total: sql<string>`COALESCE(SUM(${posSalesData.grossSales}), 0)`,
        })
        .from(posSalesData)
        .where(
          and(
            eq(posSalesData.leaseId, tenant.leaseId),
            gte(posSalesData.salesDate, prevStartStr),
            lte(posSalesData.salesDate, prevEndStr)
          )
        )

      const currentGross = currentSales.reduce((sum, s) => sum + Number(s.grossSales), 0)
      const prevGross = Number(prevSalesResult[0]?.total || 0)
      const revSharePct = Number(tenant.revenueSharePercentage || 0)
      const revShareDue = currentGross * (revSharePct / 100)

      // Detect anomalies based on data patterns
      let anomalyFlag: string | null = null
      if (currentSales.length >= 7) {
        const dailyValues = currentSales.map((s) => Number(s.grossSales))
        const avg = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length
        const stdDev = Math.sqrt(dailyValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / dailyValues.length)
        const cv = avg > 0 ? stdDev / avg : 0

        // Flat pattern: coefficient of variation < 5% is suspicious
        if (cv < 0.05 && currentSales.length > 14) {
          anomalyFlag = "flat"
        }

        // Under-reporting: if trend drops >40% vs previous period with same day count
        if (prevGross > 0 && currentGross < prevGross * 0.6) {
          anomalyFlag = "underreport"
        }
      }

      return {
        tenant: {
          id: tenant.tenantId,
          name: tenant.businessName,
          category: tenant.category,
          unit: tenant.unitNumber,
          floor: tenant.floor !== null ? `Floor ${tenant.floor}` : "",
          revSharePercentage: revSharePct,
          posProvider: tenant.posProvider,
          posStatus: tenant.posStatus,
        },
        grossSales: Math.round(currentGross * 100) / 100,
        totalTransactions: currentSales.reduce((sum, s) => sum + (s.transactionCount || 0), 0),
        avgDailySales: currentSales.length > 0 ? Math.round((currentGross / currentSales.length) * 100) / 100 : 0,
        revenueShareDue: Math.round(revShareDue * 100) / 100,
        trend: prevGross > 0 ? Math.round(((currentGross - prevGross) / prevGross) * 100 * 10) / 10 : 0,
        anomalyFlag,
        dailySales: currentSales.map((s) => ({
          date: s.salesDate,
          grossSales: Math.round(Number(s.grossSales) * 100) / 100,
          transactionCount: s.transactionCount || 0,
        })),
      }
    })

    const tenantData = await Promise.all(tenantDataPromises)

    // Aggregate stats
    const totalPOSRevenue = tenantData.reduce((sum, t) => sum + t.grossSales, 0)
    const prevTotalResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${posSalesData.grossSales}), 0)`,
      })
      .from(posSalesData)
      .where(
        and(
          gte(posSalesData.salesDate, prevStartStr),
          lte(posSalesData.salesDate, prevEndStr),
          ...(propertyId ? [eq(posSalesData.propertyId, propertyId)] : [])
        )
      )
    const prevTotalRevenue = Number(prevTotalResult[0]?.total || 0)

    const totalRevenueShareDue = tenantData.reduce((sum, t) => sum + t.revenueShareDue, 0)

    // Aggregate daily chart data
    const dailyAggregated: Record<string, { date: string; grossSales: number; transactions: number }> = {}
    tenantData.forEach((t) => {
      t.dailySales.forEach((s) => {
        if (!dailyAggregated[s.date]) {
          dailyAggregated[s.date] = { date: s.date, grossSales: 0, transactions: 0 }
        }
        dailyAggregated[s.date].grossSales += s.grossSales
        dailyAggregated[s.date].transactions += s.transactionCount
      })
    })
    const dailyChart = Object.values(dailyAggregated).sort((a, b) => a.date.localeCompare(b.date))

    // Anomaly detection
    const anomalies = tenantData
      .filter((t) => t.anomalyFlag)
      .map((t) => ({
        tenantId: t.tenant.id,
        tenantName: t.tenant.name,
        unit: t.tenant.unit,
        type: t.anomalyFlag,
        description:
          t.anomalyFlag === "underreport"
            ? `Sales figures significantly below expected range for ${t.tenant.category} category. Possible under-reporting detected.`
            : `Sales data shows suspiciously uniform values across days. Pattern suggests manual data entry rather than POS integration.`,
        severity: t.anomalyFlag === "underreport" ? "high" : "medium",
        recommendation:
          t.anomalyFlag === "underreport"
            ? "Schedule audit review and cross-verify with bank settlement data."
            : "Verify POS integration is active and confirm API connection is transmitting real-time data.",
        currentAvgDaily: t.avgDailySales,
      }))

    // Compute last sync time across all connected integrations
    const lastSyncTimes = connectedTenants
      .map((t) => t.posLastSyncAt)
      .filter(Boolean)
      .map((d) => new Date(d!).getTime())
    const lastSyncAt = lastSyncTimes.length > 0
      ? new Date(Math.max(...lastSyncTimes)).toISOString()
      : null

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalPOSRevenue: Math.round(totalPOSRevenue * 100) / 100,
          prevPeriodRevenue: Math.round(prevTotalRevenue * 100) / 100,
          revenueTrend: prevTotalRevenue > 0 ? Math.round(((totalPOSRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 * 10) / 10 : 0,
          revenueShareDue: Math.round(totalRevenueShareDue * 100) / 100,
          connectedStores: connectedTenants.length,
          totalRevShareTenants: revShareLeases.length,
          notConnectedCount: notConnectedTenants.length,
          lastSyncAt,
        },
        tenants: tenantData.map((t) => ({
          ...t.tenant,
          grossSales: t.grossSales,
          totalTransactions: t.totalTransactions,
          avgDailySales: t.avgDailySales,
          revenueShareDue: t.revenueShareDue,
          trend: t.trend,
          anomalyFlag: t.anomalyFlag,
        })),
        notConnected: notConnectedTenants.map((t) => ({
          id: t.tenantId,
          name: t.businessName,
          category: t.category,
          unit: t.unitNumber,
          floor: t.floor !== null ? `Floor ${t.floor}` : "",
          revSharePercentage: Number(t.revenueSharePercentage || 0),
          leaseId: t.leaseId,
          propertyId: t.leasePropertyId,
        })),
        dailyChart,
        anomalies,
        period: {
          start: startStr,
          end: endStr,
          days,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching revenue intelligence:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch revenue intelligence data" },
      { status: 500 }
    )
  }
}
