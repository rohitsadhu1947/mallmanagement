// ============================================================================
// POS Integration Types & Provider Metadata
// ============================================================================

export type POSProviderKey =
  | "pine_labs"
  | "razorpay_pos"
  | "petpooja"
  | "posist"
  | "shopify"
  | "square"
  | "lightspeed"
  | "vend"

export interface POSProviderMeta {
  key: POSProviderKey
  name: string
  icon: string // Emoji for UI display
  description: string
  region: "india" | "global" | "both"
  apiDocsUrl: string
  supportedFeatures: string[]
  avgSetupTime: string
}

export interface POSConnectionConfig {
  provider: POSProviderKey
  storeId: string
  locationId?: string
  apiKey: string
  apiSecret?: string
  webhookUrl?: string
  syncFrequency: "real_time" | "hourly" | "daily"
  additionalConfig?: Record<string, unknown>
}

export interface POSSalesRecord {
  date: string // ISO date string YYYY-MM-DD
  grossSales: number
  netSales: number
  refunds: number
  discounts: number
  transactionCount: number
  avgTransactionValue: number
  categoryBreakdown: Record<string, number> // category → amount
  hourlyBreakdown: Record<string, number> // hour (0-23) → amount
}

export interface POSConnectionTestResult {
  success: boolean
  message: string
  storeName?: string
  lastTransactionDate?: string
  providerVersion?: string
}

export interface POSProvider {
  readonly providerKey: POSProviderKey

  /** Test the connection without saving any data */
  testConnection(config: POSConnectionConfig): Promise<POSConnectionTestResult>

  /** Fetch sales data for a specific date */
  fetchDailySales(config: POSConnectionConfig, date: string): Promise<POSSalesRecord>

  /** Fetch sales data for a date range */
  fetchSalesRange(
    config: POSConnectionConfig,
    startDate: string,
    endDate: string,
    tenantCategory?: string
  ): Promise<POSSalesRecord[]>

  /** Disconnect/revoke access */
  disconnect(config: POSConnectionConfig): Promise<boolean>
}

// ============================================================================
// Provider Registry — all supported POS systems
// ============================================================================

export const POS_PROVIDERS: POSProviderMeta[] = [
  // Indian Providers
  {
    key: "pine_labs",
    name: "Pine Labs",
    icon: "🌲",
    description: "India's leading POS platform for retail and restaurants. Supports 3.5L+ merchants.",
    region: "india",
    apiDocsUrl: "https://developer.pinelabs.com",
    supportedFeatures: ["daily_sales", "transaction_details", "category_breakdown", "payment_modes"],
    avgSetupTime: "15 minutes",
  },
  {
    key: "razorpay_pos",
    name: "Razorpay POS",
    icon: "⚡",
    description: "Razorpay's point-of-sale solution with seamless payment processing and analytics.",
    region: "india",
    apiDocsUrl: "https://razorpay.com/docs/pos",
    supportedFeatures: ["daily_sales", "transaction_details", "real_time_sync", "settlement_data"],
    avgSetupTime: "10 minutes",
  },
  {
    key: "petpooja",
    name: "Petpooja",
    icon: "🍽️",
    description: "India's #1 restaurant POS. Manages orders, inventory, billing, and CRM.",
    region: "india",
    apiDocsUrl: "https://www.petpooja.com/developers",
    supportedFeatures: ["daily_sales", "order_details", "category_breakdown", "hourly_data"],
    avgSetupTime: "20 minutes",
  },
  {
    key: "posist",
    name: "POSist",
    icon: "🏪",
    description: "Cloud-based restaurant technology platform serving 15,000+ restaurants globally.",
    region: "india",
    apiDocsUrl: "https://www.posist.com/api-docs",
    supportedFeatures: ["daily_sales", "transaction_details", "category_breakdown", "inventory_sync"],
    avgSetupTime: "15 minutes",
  },
  // Global Providers
  {
    key: "shopify",
    name: "Shopify POS",
    icon: "🛍️",
    description: "Unified commerce platform for retail. Omnichannel POS with online store sync.",
    region: "global",
    apiDocsUrl: "https://shopify.dev/docs/api",
    supportedFeatures: ["daily_sales", "transaction_details", "category_breakdown", "hourly_data", "inventory_sync"],
    avgSetupTime: "10 minutes",
  },
  {
    key: "square",
    name: "Square POS",
    icon: "🟦",
    description: "All-in-one POS solution for payments, inventory, and business analytics.",
    region: "global",
    apiDocsUrl: "https://developer.squareup.com",
    supportedFeatures: ["daily_sales", "transaction_details", "category_breakdown", "hourly_data", "real_time_sync"],
    avgSetupTime: "10 minutes",
  },
  {
    key: "lightspeed",
    name: "Lightspeed POS",
    icon: "💡",
    description: "Cloud-based POS for retail and restaurant. Advanced reporting and multi-location.",
    region: "global",
    apiDocsUrl: "https://developers.lightspeedhq.com",
    supportedFeatures: ["daily_sales", "transaction_details", "category_breakdown", "multi_location"],
    avgSetupTime: "15 minutes",
  },
  {
    key: "vend",
    name: "Vend (Lightspeed X)",
    icon: "🏷️",
    description: "Cloud POS for retail stores. Inventory management, customer loyalty, and reporting.",
    region: "global",
    apiDocsUrl: "https://docs.vendhq.com",
    supportedFeatures: ["daily_sales", "transaction_details", "category_breakdown", "customer_data"],
    avgSetupTime: "15 minutes",
  },
]

export const INDIAN_PROVIDERS = POS_PROVIDERS.filter((p) => p.region === "india")
export const GLOBAL_PROVIDERS = POS_PROVIDERS.filter((p) => p.region === "global")

export function getProviderMeta(key: POSProviderKey): POSProviderMeta | undefined {
  return POS_PROVIDERS.find((p) => p.key === key)
}
