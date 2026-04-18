import { eq } from "drizzle-orm"
import { db } from "./db"
import { organization } from "./schema"

// ---------------------------------------------------------------------------
// Stare plans
// ---------------------------------------------------------------------------

export type Plan = "free" | "pro" | "team"

export const PLAN_LIMITS: Record<Plan, { machines: number; alerts: number; dashboards: number }> = {
  free:  { machines: 3,        alerts: 5,        dashboards: 3 },
  pro:   { machines: 20,       alerts: Infinity,  dashboards: Infinity },
  team:  { machines: Infinity, alerts: Infinity,  dashboards: Infinity },
}

/** Stare Polar productId → plan slug */
export const PRODUCT_PLAN_MAP: Record<string, Plan> = {
  "57ebfc19-4a1b-4259-a116-d8a0833b7da3": "pro",   // Stare Pro monthly
  "51543af2-05cb-4321-874e-c6ae4bcf38b0": "team",  // Stare Team monthly
}

// ---------------------------------------------------------------------------
// Lens plans
// ---------------------------------------------------------------------------

export type LensPlan = "none" | "starter" | "growth"

/** Lens Polar productId → lens plan slug */
export const LENS_PRODUCT_PLAN_MAP: Record<string, LensPlan> = {
  "36ce2e1a-62de-46e9-a507-9b1e1f43e667": "starter",  // Lens Starter monthly
  "039fe991-c84f-4721-9cde-61fd7a78bf1e": "growth",   // Lens Growth monthly
}

// ---------------------------------------------------------------------------
// Org metadata helpers — read/write both plans from the same JSON blob
// ---------------------------------------------------------------------------

async function getOrgMeta(orgId: string): Promise<Record<string, string>> {
  const [org] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1)

  if (!org?.metadata) return {}
  try { return JSON.parse(org.metadata) as Record<string, string> } catch { return {} }
}

async function setOrgMeta(orgId: string, patch: Record<string, string>): Promise<void> {
  const meta = await getOrgMeta(orgId)
  await db
    .update(organization)
    .set({ metadata: JSON.stringify({ ...meta, ...patch }) })
    .where(eq(organization.id, orgId))
}

// ---------------------------------------------------------------------------
// Stare plan
// ---------------------------------------------------------------------------

export async function getOrgPlan(orgId: string): Promise<Plan> {
  const meta = await getOrgMeta(orgId)
  const plan = meta.plan as Plan
  return plan === "pro" || plan === "team" ? plan : "free"
}

export async function setOrgPlan(orgId: string, plan: Plan): Promise<void> {
  await setOrgMeta(orgId, { plan })
}

// ---------------------------------------------------------------------------
// Lens plan
// ---------------------------------------------------------------------------

export async function getOrgLensPlan(orgId: string): Promise<LensPlan> {
  const meta = await getOrgMeta(orgId)
  const plan = meta.lensPlan as LensPlan
  return plan === "starter" || plan === "growth" ? plan : "none"
}

export async function setOrgLensPlan(orgId: string, plan: LensPlan): Promise<void> {
  await setOrgMeta(orgId, { lensPlan: plan })
}
