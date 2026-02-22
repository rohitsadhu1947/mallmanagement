// ============================================================================
// POS Provider Factory
// ============================================================================
// Returns the correct POS provider adapter based on provider key.
// Uses mock provider for demo; real providers for production.

import type { POSProvider, POSProviderKey, POSProviderMeta } from "./types"
import { POS_PROVIDERS, INDIAN_PROVIDERS, GLOBAL_PROVIDERS } from "./types"
import { MockPOSProvider } from "./providers/mock"
import { ShopifyPOSProvider } from "./providers/shopify"

// In demo mode, all providers use the mock adapter
const USE_MOCK = process.env.POS_USE_MOCK !== "false" // Default: true (mock mode)

/**
 * Get a POS provider adapter instance
 * In demo/dev mode, returns mock provider. In production, returns real adapter.
 */
export function getPOSProvider(providerKey: POSProviderKey): POSProvider {
  if (USE_MOCK) {
    return new MockPOSProvider()
  }

  switch (providerKey) {
    case "shopify":
      return new ShopifyPOSProvider()
    // Other real providers will be added here as they are built
    case "pine_labs":
    case "razorpay_pos":
    case "petpooja":
    case "posist":
    case "square":
    case "lightspeed":
    case "vend":
    default:
      // Fall back to mock for providers not yet implemented
      return new MockPOSProvider()
  }
}

/**
 * Get all available POS providers with metadata
 */
export function getAvailableProviders(): POSProviderMeta[] {
  return POS_PROVIDERS
}

/**
 * Get providers grouped by region
 */
export function getProvidersByRegion(): { indian: POSProviderMeta[]; global: POSProviderMeta[] } {
  return {
    indian: INDIAN_PROVIDERS,
    global: GLOBAL_PROVIDERS,
  }
}

/**
 * Check if running in demo/mock mode
 */
export function isDemoMode(): boolean {
  return USE_MOCK
}

export { POS_PROVIDERS, INDIAN_PROVIDERS, GLOBAL_PROVIDERS } from "./types"
export type { POSProvider, POSProviderKey, POSProviderMeta, POSConnectionConfig, POSSalesRecord } from "./types"
