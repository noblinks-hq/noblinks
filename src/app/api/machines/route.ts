import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { machine } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const unassigned = searchParams.get("unassigned") === "true";

  const conditions = [eq(machine.organizationId, orgScope(session))];
  if (unassigned) {
    conditions.push(isNull(machine.category));
  }

  const machines = await db
    .select()
    .from(machine)
    .where(and(...conditions))
    .orderBy(machine.createdAt);

  return Response.json({ machines });
}
