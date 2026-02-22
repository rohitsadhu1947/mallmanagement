import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { sql as rawSql } from "drizzle-orm"

const sqlClient = neon(process.env.DATABASE_URL!)
const db = drizzle(sqlClient)

/**
 * CLEAN RESET — Wipes all transactional data but keeps:
 * - organizations
 * - properties (the 2 malls)
 * - users (admin login)
 * - roles
 *
 * Deletes (in order to respect FK constraints):
 * - pos_sales_data
 * - pos_integrations
 * - payments
 * - invoices
 * - daily_metrics
 * - agent_actions
 * - agent_decisions
 * - agents
 * - messages
 * - conversations
 * - notifications
 * - work_orders
 * - equipment
 * - expenses
 * - compliance_requirements
 * - vendors
 * - leases
 * - tenants
 */
async function resetClean() {
  console.log("🧹 Starting clean reset...")
  console.log("   Keeping: organizations, properties, users, roles")
  console.log("   Deleting: everything else\n")

  const tablesToClear = [
    "pos_sales_data",
    "pos_integrations",
    "payments",
    "invoices",
    "daily_metrics",
    "agent_actions",
    "agent_decisions",
    "agents",
    "messages",
    "conversations",
    "notifications",
    "work_orders",
    "equipment",
    "expenses",
    "compliance_requirements",
    "vendors",
    "leases",
    "tenants",
  ]

  for (const table of tablesToClear) {
    try {
      await db.execute(rawSql.raw(`DELETE FROM "${table}"`))
      console.log(`   ✓ Cleared ${table}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Table might not exist if schema hasn't been pushed yet
      if (msg.includes("does not exist")) {
        console.log(`   - Skipped ${table} (table not found)`)
      } else {
        console.error(`   ✗ Error clearing ${table}: ${msg}`)
      }
    }
  }

  // Verify what's left
  console.log("\n📊 Remaining data:")

  const orgs = await db.execute(rawSql.raw(`SELECT COUNT(*) as count FROM "organizations"`))
  console.log(`   Organizations: ${(orgs as any)[0]?.count || 0}`)

  const props = await db.execute(rawSql.raw(`SELECT id, name FROM "properties" ORDER BY name`))
  console.log(`   Properties: ${(props as any).length}`)
  for (const p of props as any[]) {
    console.log(`     - ${p.name} (${p.id})`)
  }

  const usersResult = await db.execute(rawSql.raw(`SELECT email, name FROM "users" ORDER BY email`))
  console.log(`   Users: ${(usersResult as any).length}`)
  for (const u of usersResult as any[]) {
    console.log(`     - ${u.email} (${u.name})`)
  }

  console.log("\n✅ Clean reset complete. Ready for fresh testing.")
}

resetClean().catch(console.error)
