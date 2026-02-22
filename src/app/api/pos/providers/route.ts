import { NextResponse } from "next/server"
import { getAvailableProviders, getProvidersByRegion } from "@/lib/pos"

export async function GET() {
  try {
    const providers = getAvailableProviders()
    const { indian, global } = getProvidersByRegion()

    return NextResponse.json({
      success: true,
      data: {
        all: providers,
        indian,
        global,
      },
    })
  } catch (error) {
    console.error("Error fetching POS providers:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch POS providers" },
      { status: 500 }
    )
  }
}
