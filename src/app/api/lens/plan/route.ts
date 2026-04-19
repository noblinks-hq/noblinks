import { requireApiAuth } from "@/lib/session";
import { getOrgLensPlan } from "@/lib/plan";
import { db } from "@/lib/db";
import { lensAnalysis } from "@/lib/schema";
import { eq, and, gte, count } from "drizzle-orm";

const MONTHLY_LIMITS: Record<string, number> = { none: 1, starter: 5, growth: 20 };

export async function GET() {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const orgId = session.session.activeOrganizationId ?? "";
  const plan = await getOrgLensPlan(orgId);
  const limit = MONTHLY_LIMITS[plan] ?? 1;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ value: count() })
    .from(lensAnalysis)
    .where(and(eq(lensAnalysis.organizationId, orgId), gte(lensAnalysis.createdAt, startOfMonth)));

  const used = rows[0]?.value ?? 0;

  return Response.json({ plan, used, limit });
}
