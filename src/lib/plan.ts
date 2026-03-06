import { eq } from "drizzle-orm"
import { db } from "./db"
import { organization } from "./schema"

export type Plan = "free" | "pro" | "team"

export const PLAN_LIMITS: Record<Plan, { machines: number; alerts: number; dashboards: number }> = {
  free:  { machines: 3,        alerts: 5,        dashboards: 3 },
  pro:   { machines: 20,       alerts: Infinity,  dashboards: Infinity },
  team:  { machines: Infinity, alerts: Infinity,  dashboards: Infinity },
}

/** Map Polar productId → plan slug (monthly + annual) */
export const PRODUCT_PLAN_MAP: Record<string, Plan> = {
  "57ebfc19-4a1b-4259-a116-d8a0833b7da3": "pro",   // Pro monthly
  "51543af2-05cb-4321-874e-c6ae4bcf38b0": "team",  // Team monthly
  // TODO: add annual product IDs once created in Polar dashboard
}

export async function getOrgPlan(orgId: string): Promise<Plan> {
  const [org] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1)

  if (!org?.metadata) return "free"
  try {
    const meta = JSON.parse(org.metadata) as Record<string, string>
    const plan = meta.plan as Plan
    return plan === "pro" || plan === "team" ? plan : "free"
  } catch {
    return "free"
  }
}

export async function setOrgPlan(orgId: string, plan: Plan): Promise<void> {
  const [org] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1)

  let meta: Record<string, string> = {}
  if (org?.metadata) {
    try { meta = JSON.parse(org.metadata) as Record<string, string> } catch { /* ignore */ }
  }
  meta.plan = plan

  await db
    .update(organization)
    .set({ metadata: JSON.stringify(meta) })
    .where(eq(organization.id, orgId))
}
