import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { machine } from "@/lib/schema";
import { requireApiPermission } from "@/lib/session";

const VALID_CATEGORIES = ["linux", "windows", "kubernetes"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiPermission({
    machine: ["update"],
  });
  if (error) return error;

  const { id } = await params;
  const body = (await request.json()) as { category?: string };

  if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
    return Response.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select()
    .from(machine)
    .where(
      and(eq(machine.id, id), eq(machine.organizationId, orgScope(session)))
    )
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Machine not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(machine)
    .set({ category: body.category })
    .where(eq(machine.id, id))
    .returning();

  return Response.json({ machine: updated });
}
