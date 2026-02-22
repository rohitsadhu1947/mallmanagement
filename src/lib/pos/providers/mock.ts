// ============================================================================
// Mock POS Provider — For Demo & Development
// ============================================================================
// Generates realistic sales data without hitting any real API.
// Uses the mock data generator for category-aware, pattern-rich data.

import type { POSProvider, POSConnectionConfig, POSSalesRecord, POSConnectionTestResult } from "../types"
import { generateMockSalesData } from "../mock-data-generator"

// Provider-specific Store ID format requirements
const STORE_ID_FORMATS: Record<string, { prefix: string; hint: string; minLength: number }> = {
  pine_labs: { prefix: "PL-", hint: "Pine Labs Store ID must start with 'PL-' (e.g., PL-MUM-4821)", minLength: 6 },
  razorpay_pos: { prefix: "rzp_", hint: "Razorpay Store ID must start with 'rzp_' (e.g., rzp_store_Kx9n2Bq)", minLength: 8 },
  petpooja: { prefix: "PP", hint: "Petpooja Store ID must start with 'PP' (e.g., PP78234)", minLength: 6 },
  posist: { prefix: "PST-", hint: "POSist Store ID must start with 'PST-' (e.g., PST-DEL-0091)", minLength: 6 },
  shopify: { prefix: "", hint: "Shopify Store ID should be your myshopify.com subdomain (e.g., my-store-name)", minLength: 4 },
  square: { prefix: "sq_", hint: "Square Location ID must start with 'sq_' (e.g., sq_loc_ABC123)", minLength: 8 },
  lightspeed: { prefix: "LS", hint: "Lightspeed Account ID must start with 'LS' (e.g., LS482910)", minLength: 6 },
  vend: { prefix: "", hint: "Vend Store ID should be your store domain prefix (e.g., mystore)", minLength: 4 },
}

// Provider display names for error messages
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  pine_labs: "Pine Labs",
  razorpay_pos: "Razorpay POS",
  petpooja: "Petpooja",
  posist: "POSist",
  shopify: "Shopify POS",
  square: "Square",
  lightspeed: "Lightspeed",
  vend: "Vend",
}

export class MockPOSProvider implements POSProvider {
  readonly providerKey = "pine_labs" as const // Default mock provider

  async testConnection(config: POSConnectionConfig): Promise<POSConnectionTestResult> {
    // Simulate realistic network delay (800ms-1.5s)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))

    const providerName = PROVIDER_DISPLAY_NAMES[config.provider] || config.provider

    // Validate credentials are present
    if (!config.storeId || !config.apiKey) {
      return {
        success: false,
        message: "Store ID and API Key are required to establish connection.",
      }
    }

    // In demo/mock mode we accept any non-empty credentials.
    // Real providers would validate format, length, prefixes, etc.

    // Success — return realistic provider info
    const storeNames: Record<string, string> = {
      pine_labs: `${providerName} Terminal — ${config.storeId}`,
      razorpay_pos: `Razorpay POS — ${config.storeId.replace("rzp_store_", "")}`,
      petpooja: `Petpooja Outlet — ${config.storeId}`,
      posist: `POSist Restaurant — ${config.storeId}`,
      shopify: `${config.storeId}.myshopify.com`,
      square: `Square Location — ${config.storeId}`,
      lightspeed: `Lightspeed Retail — ${config.storeId}`,
      vend: `Vend Store — ${config.storeId}`,
    }

    return {
      success: true,
      message: `Successfully connected to ${providerName}. Store verified and ready to sync.`,
      storeName: storeNames[config.provider] || `${providerName} Store`,
      lastTransactionDate: new Date().toISOString().split("T")[0],
      providerVersion: "v2.1.0",
    }
  }

  async fetchDailySales(config: POSConnectionConfig, date: string): Promise<POSSalesRecord> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const records = generateMockSalesData({
      startDate: date,
      endDate: date,
      tenantCategory: (config.additionalConfig?.tenantCategory as string) || "fashion",
      tenantSeed: hashCode(config.storeId || "default"),
    })

    return records[0]
  }

  async fetchSalesRange(
    config: POSConnectionConfig,
    startDate: string,
    endDate: string,
    tenantCategory?: string
  ): Promise<POSSalesRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return generateMockSalesData({
      startDate,
      endDate,
      tenantCategory: tenantCategory || (config.additionalConfig?.tenantCategory as string) || "fashion",
      tenantSeed: hashCode(config.storeId || "default"),
      anomalyMode: (config.additionalConfig?.anomalyMode as "none" | "underreport" | "flat") || "none",
    })
  }

  async disconnect(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return true
  }
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}
