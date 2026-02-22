// ============================================================================
// Shopify POS Provider — Production-Ready Skeleton
// ============================================================================
// Real Shopify Admin API integration structure.
// Ready to be activated with actual API credentials.

import type { POSProvider, POSConnectionConfig, POSSalesRecord, POSConnectionTestResult } from "../types"

export class ShopifyPOSProvider implements POSProvider {
  readonly providerKey = "shopify" as const

  private getBaseUrl(config: POSConnectionConfig): string {
    return `https://${config.storeId}.myshopify.com/admin/api/2024-01`
  }

  private getHeaders(config: POSConnectionConfig): Record<string, string> {
    return {
      "X-Shopify-Access-Token": config.apiKey,
      "Content-Type": "application/json",
    }
  }

  async testConnection(config: POSConnectionConfig): Promise<POSConnectionTestResult> {
    try {
      const baseUrl = this.getBaseUrl(config)
      const response = await fetch(`${baseUrl}/shop.json`, {
        headers: this.getHeaders(config),
      })

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json() as { shop: { name: string } }
      return {
        success: true,
        message: `Connected to Shopify store: ${data.shop.name}`,
        storeName: data.shop.name,
        providerVersion: "2024-01",
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  async fetchDailySales(config: POSConnectionConfig, date: string): Promise<POSSalesRecord> {
    const records = await this.fetchSalesRange(config, date, date)
    return records[0] || this.emptyRecord(date)
  }

  async fetchSalesRange(
    config: POSConnectionConfig,
    startDate: string,
    endDate: string,
  ): Promise<POSSalesRecord[]> {
    try {
      const baseUrl = this.getBaseUrl(config)

      // Fetch orders for the date range
      const response = await fetch(
        `${baseUrl}/orders.json?status=any&created_at_min=${startDate}T00:00:00Z&created_at_max=${endDate}T23:59:59Z&limit=250`,
        { headers: this.getHeaders(config) }
      )

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`)
      }

      const data = await response.json() as {
        orders: Array<{
          created_at: string
          total_price: string
          subtotal_price: string
          total_discounts: string
          refunds: Array<{ transactions: Array<{ amount: string }> }>
          line_items: Array<{ product_type: string; price: string; quantity: number }>
        }>
      }

      // Aggregate orders by date
      const dailyMap = new Map<string, POSSalesRecord>()

      for (const order of data.orders) {
        const orderDate = order.created_at.split("T")[0]
        const existing = dailyMap.get(orderDate) || this.emptyRecord(orderDate)

        const totalPrice = parseFloat(order.total_price)
        const subtotalPrice = parseFloat(order.subtotal_price)
        const totalDiscounts = parseFloat(order.total_discounts)
        const orderRefunds = order.refunds?.reduce((sum, r) =>
          sum + r.transactions.reduce((ts, t) => ts + parseFloat(t.amount), 0), 0) || 0

        existing.grossSales += totalPrice
        existing.discounts += totalDiscounts
        existing.refunds += orderRefunds
        existing.netSales += (subtotalPrice - orderRefunds)
        existing.transactionCount += 1

        // Category breakdown from line items
        for (const item of order.line_items) {
          const category = item.product_type || "Other"
          existing.categoryBreakdown[category] = (existing.categoryBreakdown[category] || 0) +
            (parseFloat(item.price) * item.quantity)
        }

        // Hourly breakdown
        const hour = new Date(order.created_at).getHours().toString()
        existing.hourlyBreakdown[hour] = (existing.hourlyBreakdown[hour] || 0) + totalPrice

        dailyMap.set(orderDate, existing)
      }

      // Calculate averages and round values
      const records: POSSalesRecord[] = []
      const current = new Date(startDate)
      const end = new Date(endDate)

      while (current <= end) {
        const dateStr = current.toISOString().split("T")[0]
        const record = dailyMap.get(dateStr) || this.emptyRecord(dateStr)
        record.avgTransactionValue = record.transactionCount > 0
          ? Math.round((record.grossSales / record.transactionCount) * 100) / 100
          : 0
        record.grossSales = Math.round(record.grossSales * 100) / 100
        record.netSales = Math.round(record.netSales * 100) / 100
        record.refunds = Math.round(record.refunds * 100) / 100
        record.discounts = Math.round(record.discounts * 100) / 100
        records.push(record)
        current.setDate(current.getDate() + 1)
      }

      return records
    } catch (error) {
      console.error("Shopify fetchSalesRange error:", error)
      throw error
    }
  }

  async disconnect(): Promise<boolean> {
    // Shopify: Revoke access token would go here
    return true
  }

  private emptyRecord(date: string): POSSalesRecord {
    return {
      date,
      grossSales: 0,
      netSales: 0,
      refunds: 0,
      discounts: 0,
      transactionCount: 0,
      avgTransactionValue: 0,
      categoryBreakdown: {},
      hourlyBreakdown: {},
    }
  }
}
