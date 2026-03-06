import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { getOrgPlan, PLAN_LIMITS } from "@/lib/plan";
import { dashboard } from "@/lib/schema";
import { requireApiAuth, requireApiPermission } from "@/lib/session";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const orgId = orgScope(session);

  const [dashboards, totalRows] = await Promise.all([
    db.select().from(dashboard).where(eq(dashboard.organizationId, orgId)).orderBy(dashboard.createdAt).limit(limit).offset(offset),
    db.select({ total: count() }).from(dashboard).where(eq(dashboard.organizationId, orgId)),
  ]);

  const total = Number(totalRows[0]?.total ?? 0);
  return Response.json({ dashboards, total, hasMore: offset + limit < total });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiPermission({
    dashboard: ["create"],
  });
  if (error) return error;

  const body = await request.json();
  const { name, environment, category } = body as {
    name?: string;
    environment?: string;
    category?: string;
  };

  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (!environment?.trim()) {
    return Response.json({ error: "Environment is required" }, { status: 400 });
  }

  const validCategories = ["infrastructure", "docker", "kubernetes", "custom"];
  if (!category || !validCategories.includes(category)) {
    return Response.json(
      { error: `Category must be one of: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  const orgId = orgScope(session);
  const orgPlan = await getOrgPlan(orgId);
  const dashboardLimit = PLAN_LIMITS[orgPlan].dashboards;
  if (isFinite(dashboardLimit)) {
    const [row] = await db.select({ total: count() }).from(dashboard).where(eq(dashboard.organizationId, orgId));
    if (Number(row?.total ?? 0) >= dashboardLimit) {
      return Response.json({ error: "limit_reached", resource: "dashboards", plan: orgPlan, limit: dashboardLimit }, { status: 403 });
    }
  }

  const [created] = await db
    .insert(dashboard)
    .values({
      name: name.trim(),
      environment: environment.trim(),
      category,
      organizationId: orgId,
      createdBy: session.user.id,
    })
    .returning();

  return Response.json(created, { status: 201 });
}
