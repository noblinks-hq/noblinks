import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { machine } from "@/lib/schema";
import { requireApiAuth, requireApiPermission } from "@/lib/session";


const VALID_CATEGORIES = ["linux", "windows", "kubernetes"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  const [m] = await db
    .select()
    .from(machine)
    .where(
      and(eq(machine.id, id), eq(machine.organizationId, orgScope(session)))
    )
    .limit(1);

  if (!m) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ machine: m });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiPermission({
    machine: ["update"],
  });
  if (error) return error;

  const { id } = await params;
  const body = (await request.json()) as {
    category?: string;
    environmentId?: string | null;
  };

  // Build the update payload from provided fields
  const updates: Record<string, unknown> = {};

  if (body.category !== undefined) {
    if (!VALID_CATEGORIES.includes(body.category)) {
      return Response.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }
    updates.category = body.category;
  }

  if (body.environmentId !== undefined) {
    updates.environmentId = body.environmentId;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "No valid fields to update" },
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
    .set(updates)
    .where(eq(machine.id, id))
    .returning();

  return Response.json({ machine: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiPermission({
    machine: ["delete"],
  });
  if (error) return error;

  const { id } = await params;

  const [existing] = await db
    .select({ id: machine.id })
    .from(machine)
    .where(
      and(eq(machine.id, id), eq(machine.organizationId, orgScope(session)))
    )
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Machine not found" }, { status: 404 });
  }

  await db.delete(machine).where(eq(machine.id, id));

  return Response.json({ ok: true });
}
