import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { machine } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

const VALID_CATEGORIES = ["linux", "windows", "kubernetes"];

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const unassigned = searchParams.get("unassigned") === "true";
  const environmentId = searchParams.get("environmentId");

  const conditions = [eq(machine.organizationId, orgScope(session))];
  if (unassigned) {
    conditions.push(isNull(machine.category));
  }
  if (environmentId) {
    conditions.push(eq(machine.environmentId, environmentId));
  }

  const machines = await db
    .select()
    .from(machine)
    .where(and(...conditions))
    .orderBy(machine.createdAt);

  return Response.json({ machines });
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

  const [created] = await db
    .insert(machine)
    .values({
      name: body.name.trim(),
      category: body.category ?? null,
      environmentId: body.environmentId ?? null,
      organizationId: orgScope(session),
      status: "pending",
    })
    .returning();

  return Response.json({ machine: created }, { status: 201 });
}
