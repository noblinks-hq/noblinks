import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { getOrgPlan, PLAN_LIMITS } from "@/lib/plan";
import { machine } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

const VALID_CATEGORIES = ["linux", "windows", "kubernetes"];
const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const unassigned = searchParams.get("unassigned") === "true";
  const environmentId = searchParams.get("environmentId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const conditions = [eq(machine.organizationId, orgScope(session))];
  if (unassigned) {
    conditions.push(isNull(machine.category));
  }
  if (environmentId) {
    conditions.push(eq(machine.environmentId, environmentId));
  }

  const [machines, totalRows] = await Promise.all([
    db.select().from(machine).where(and(...conditions)).orderBy(machine.createdAt).limit(limit).offset(offset),
    db.select({ total: count() }).from(machine).where(and(...conditions)),
  ]);

  const total = Number(totalRows[0]?.total ?? 0);
  return Response.json({ machines, total, hasMore: offset + limit < total });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const body = (await request.json()) as {
    name?: string;
    category?: string;
    environmentId?: string;
  };

  if (!body.name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  if (body.category && !VALID_CATEGORIES.includes(body.category)) {
    return Response.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  const orgId = orgScope(session);
  const plan = await getOrgPlan(orgId);
  const limit = PLAN_LIMITS[plan].machines;
  if (isFinite(limit)) {
    const [row] = await db.select({ total: count() }).from(machine).where(eq(machine.organizationId, orgId));
    if (Number(row?.total ?? 0) >= limit) {
      return Response.json({ error: "limit_reached", resource: "machines", plan, limit }, { status: 403 });
    }
  }

  const [created] = await db
    .insert(machine)
    .values({
      name: body.name.trim(),
      category: body.category ?? null,
      environmentId: body.environmentId ?? null,
      organizationId: orgId,
      status: "pending",
    })
    .returning();

  return Response.json({ machine: created }, { status: 201 });
}
