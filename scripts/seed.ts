import * as dotenv from "dotenv"
// Load env vars BEFORE any other imports
dotenv.config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "../src/lib/db/schema"
import bcrypt from "bcryptjs"

const {
  organizations,
  properties,
  tenants,
  leases,
  users,
  agents,
  workOrders,
  invoices,
  dailyMetrics,
} = schema

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function seed() {
  console.log("🌱 Starting database seed...")
  
  // Clean up existing data (in reverse order of dependencies)
  console.log("🧹 Cleaning up existing data...")
  await db.delete(dailyMetrics)
  await db.delete(invoices)
  await db.delete(workOrders)
  await db.delete(agents)
  await db.delete(leases)
  await db.delete(tenants)
  await db.delete(users)
  await db.delete(properties)
  await db.delete(organizations)
  console.log("✅ Cleanup complete")

  // Create organization
  const orgId = crypto.randomUUID()
  await db.insert(organizations).values({
    id: orgId,
    name: "Metro Properties Group",
    code: "MPG001",
    type: "corporate",
    settings: {
      currency: "INR",
      timezone: "Asia/Kolkata",
      fiscalYearStart: "04-01",
    },
  })
  console.log("✅ Organization created")

  // Create property
  const propertyId = crypto.randomUUID()
  await db.insert(properties).values({
    id: propertyId,
    organizationId: orgId,
    name: "Metro Mall",
    code: "MM001",
    type: "shopping_mall",
    address: "Plot No. 45, Sector 29",
    city: "Gurgaon",
    state: "Haryana",
    country: "India",
    pincode: "122001",
    totalAreaSqft: "250000",
    leasableAreaSqft: "180000",
    floors: 4,
    status: "active",
    operatingHours: {
      weekdays: "10:00-22:00",
      weekends: "10:00-23:00",
    },
    amenities: ["Parking", "Food Court", "Multiplex", "Kids Zone"],
    metadata: {
      parkingSpaces: 500,
      maintenanceDay: "Monday",
    },
  })
  console.log("✅ Property created")

  // Create users
  const adminId = crypto.randomUUID()
  const managerId = crypto.randomUUID()
  const hashedPassword = await bcrypt.hash("demo123456", 10)

  await db.insert(users).values([
    {
      id: adminId,
      organizationId: orgId,
      email: "admin@metromall.com",
      name: "John Doe",
      password: hashedPassword,
      status: "active",
    },
    {
      id: managerId,
      organizationId: orgId,
      email: "manager@metromall.com",
      name: "Sarah Smith",
      password: hashedPassword,
      status: "active",
    },
  ])
  console.log("✅ Users created")

  // Create tenants
  const tenantIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]
  await db.insert(tenants).values([
    {
      id: tenantIds[0],
      propertyId,
      businessName: "Lifestyle Fashion",
      legalEntityName: "Lifestyle International Pvt Ltd",
      category: "fashion",
      contactPerson: "Rahul Sharma",
      email: "rahul@lifestyle.com",
      phone: "+91-9876543210",
      gstin: "06AABCT1234A1ZA",
      status: "active",
    },
    {
      id: tenantIds[1],
      propertyId,
      businessName: "Café Coffee Day",
      legalEntityName: "Coffee Day Enterprises Ltd",
      category: "food_beverage",
      contactPerson: "Priya Patel",
      email: "priya@ccd.com",
      phone: "+91-9876543211",
      gstin: "06AABCT5678B1ZB",
      status: "active",
    },
    {
      id: tenantIds[2],
      propertyId,
      businessName: "Tech World Electronics",
      legalEntityName: "Tech World Retail Pvt Ltd",
      category: "electronics",
      contactPerson: "Amit Kumar",
      email: "amit@techworld.com",
      phone: "+91-9876543212",
      gstin: "06AABCT9012C1ZC",
      status: "active",
    },
  ])
  console.log("✅ Tenants created")

  // Create leases
  const leaseIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]
  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate())
  const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())

  await db.insert(leases).values([
    {
      id: leaseIds[0],
      propertyId,
      tenantId: tenantIds[0],
      unitNumber: "203",
      floor: 2,
      areaSqft: "1200",
      leaseType: "fixed_rent",
      baseRent: "150000",
      securityDeposit: "900000",
      camCharges: "15000",
      startDate: oneYearAgo.toISOString().split("T")[0],
      endDate: twoYearsFromNow.toISOString().split("T")[0],
      status: "active",
      rentEscalationPercentage: "5",
      escalationFrequencyMonths: 12,
    },
    {
      id: leaseIds[1],
      propertyId,
      tenantId: tenantIds[1],
      unitNumber: "G-15",
      floor: 0,
      areaSqft: "800",
      leaseType: "fixed_rent",
      baseRent: "120000",
      securityDeposit: "720000",
      camCharges: "10000",
      startDate: oneYearAgo.toISOString().split("T")[0],
      endDate: twoYearsFromNow.toISOString().split("T")[0],
      status: "active",
      rentEscalationPercentage: "5",
      escalationFrequencyMonths: 12,
    },
    {
      id: leaseIds[2],
      propertyId,
      tenantId: tenantIds[2],
      unitNumber: "105",
      floor: 1,
      areaSqft: "1500",
      leaseType: "fixed_rent",
      baseRent: "100000",
      securityDeposit: "600000",
      camCharges: "12000",
      startDate: oneYearAgo.toISOString().split("T")[0],
      endDate: threeMonthsFromNow.toISOString().split("T")[0],
      status: "active",
      rentEscalationPercentage: "5",
      escalationFrequencyMonths: 12,
    },
  ])
  console.log("✅ Leases created")

  // Create AI agents
  const agentIds = {
    tenantRelations: crypto.randomUUID(),
    operations: crypto.randomUUID(),
    financial: crypto.randomUUID(),
    maintenance: crypto.randomUUID(),
  }
  
  await db.insert(agents).values([
    {
      id: agentIds.tenantRelations,
      type: "tenant_relations",
      name: "Tenant Relations Manager",
      description: "Handles tenant communications, support requests, and relationship management",
      status: "active",
      model: "claude-sonnet-4-5-20250929",
      systemPrompt: "You are the Tenant Relations Manager AI Agent. Your role is to provide exceptional tenant support, handle inquiries, resolve issues, and maintain positive relationships with all tenants.",
      capabilities: ["search_tenant_history", "get_tenant_info", "create_work_order", "send_communication"],
      config: {
        temperature: 0.7,
        maxTokens: 4096,
      },
    },
    {
      id: agentIds.operations,
      type: "operations_commander",
      name: "Operations Commander",
      description: "Oversees daily mall operations, coordinates activities, and identifies anomalies",
      status: "active",
      model: "claude-sonnet-4-5-20250929",
      systemPrompt: "You are the Operations Commander AI Agent. Your role is to oversee daily mall operations, coordinate activities across departments, and identify operational anomalies.",
      capabilities: ["analyze_metrics", "coordinate_teams", "detect_anomalies", "generate_reports"],
      config: {
        temperature: 0.5,
        maxTokens: 4096,
      },
    },
    {
      id: agentIds.financial,
      type: "financial_analyst",
      name: "Financial Analyst",
      description: "Manages financial operations, predicts payments, and provides financial insights",
      status: "active",
      model: "claude-sonnet-4-5-20250929",
      systemPrompt: "You are the Financial Analyst AI Agent. Your role is to manage financial operations, predict payment behaviors, and provide actionable financial insights.",
      capabilities: ["analyze_payments", "predict_collections", "generate_financial_reports", "send_reminders"],
      config: {
        temperature: 0.3,
        maxTokens: 4096,
      },
    },
    {
      id: agentIds.maintenance,
      type: "maintenance_coordinator",
      name: "Maintenance Coordinator",
      description: "Coordinates maintenance activities, predicts equipment failures, and optimizes schedules",
      status: "active",
      model: "claude-sonnet-4-5-20250929",
      systemPrompt: "You are the Maintenance Coordinator AI Agent. Your role is to coordinate maintenance activities, predict equipment failures, and optimize maintenance schedules.",
      capabilities: ["schedule_maintenance", "predict_failures", "assign_technicians", "track_equipment"],
      config: {
        temperature: 0.5,
        maxTokens: 4096,
      },
    },
  ])
  console.log("✅ AI Agents created")

  // Create sample work orders
  await db.insert(workOrders).values([
    {
      id: crypto.randomUUID(),
      propertyId,
      tenantId: tenantIds[0],
      workOrderNumber: "WO-2024-0847",
      category: "hvac",
      priority: "high",
      title: "AC not cooling properly",
      description: "The air conditioning unit in Unit 203 is not cooling effectively. Customers are complaining about the heat.",
      location: "Unit 203, 2nd Floor",
      status: "in_progress",
      reportedBy: adminId,
      reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: crypto.randomUUID(),
      propertyId,
      tenantId: tenantIds[1],
      workOrderNumber: "WO-2024-0846",
      category: "plumbing",
      priority: "medium",
      title: "Water pressure issue",
      description: "Low water pressure in the kitchen area affecting operations.",
      location: "Unit G-15, Ground Floor",
      status: "open",
      reportedBy: managerId,
      reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ])
  console.log("✅ Work orders created")

  // Create sample invoices
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  await db.insert(invoices).values([
    {
      id: crypto.randomUUID(),
      leaseId: leaseIds[0],
      invoiceNumber: "INV-2024-001234",
      invoiceType: "rent",
      periodStart: periodStart.toISOString().split("T")[0],
      periodEnd: periodEnd.toISOString().split("T")[0],
      amount: "165000",
      gstAmount: "29700",
      totalAmount: "194700",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "pending",
    },
    {
      id: crypto.randomUUID(),
      leaseId: leaseIds[1],
      invoiceNumber: "INV-2024-001235",
      invoiceType: "rent",
      periodStart: periodStart.toISOString().split("T")[0],
      periodEnd: periodEnd.toISOString().split("T")[0],
      amount: "130000",
      gstAmount: "23400",
      totalAmount: "153400",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "overdue",
    },
  ])
  console.log("✅ Invoices created")

  // Create daily metrics
  const metricsDate = new Date()
  metricsDate.setHours(0, 0, 0, 0)

  await db.insert(dailyMetrics).values({
    id: crypto.randomUUID(),
    propertyId,
    metricDate: metricsDate.toISOString().split("T")[0],
    occupancyRate: "94.5",
    collectionRate: "87.2",
    tenantSatisfaction: "4.2",
    maintenanceTickets: 12,
    maintenanceResolved: 8,
    agentActionsTaken: 25,
    agentActionsApproved: 22,
    revenue: "4500000",
    expenses: "1200000",
    footTraffic: 12500,
    metadata: {
      peakHour: "18:00",
      topCategory: "fashion",
    },
  })
  console.log("✅ Daily metrics created")

  console.log("\n🎉 Database seeded successfully!")
  console.log("\n📝 Demo credentials:")
  console.log("   Email: admin@metromall.com")
  console.log("   Password: demo123456")
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })

