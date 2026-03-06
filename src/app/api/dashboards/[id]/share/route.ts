import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { dashboard } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

function generateToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

/** Enable public sharing — returns the token */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  const [found] = await db
    .select()
    .from(dashboard)
    .where(and(eq(dashboard.id, id), eq(dashboard.organizationId, orgScope(session))));

  if (!found) {
    return Response.json({ error: "Dashboard not found" }, { status: 404 });
  }

  if (found.publicToken) {
    // Already shared — return existing token
    return Response.json({ token: found.publicToken });
  }

  const token = generateToken();

  const [updated] = await db
    .update(dashboard)
    .set({ publicToken: token })
    .where(eq(dashboard.id, id))
    .returning();

  return Response.json({ token: updated?.publicToken ?? token });
}

/** Revoke public sharing */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  const [updated] = await db
    .update(dashboard)
    .set({ publicToken: null })
    .where(and(eq(dashboard.id, id), eq(dashboard.organizationId, orgScope(session))))
    .returning();

  if (!updated) {
    return Response.json({ error: "Dashboard not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
