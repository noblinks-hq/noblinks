import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { notificationChannel } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { name, enabled } = body as { name?: string; enabled?: boolean };

  const updates: Partial<{ name: string; enabled: boolean }> = {};
  if (name !== undefined) updates.name = name.trim();
  if (enabled !== undefined) updates.enabled = enabled;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(notificationChannel)
    .set(updates)
    .where(
      and(
        eq(notificationChannel.id, id),
        eq(notificationChannel.organizationId, orgScope(session))
      )
    )
    .returning();

  if (!updated) {
    return Response.json({ error: "Channel not found" }, { status: 404 });
  }

  return Response.json({ channel: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  const [deleted] = await db
    .delete(notificationChannel)
    .where(
      and(
        eq(notificationChannel.id, id),
        eq(notificationChannel.organizationId, orgScope(session))
      )
    )
    .returning();

  if (!deleted) {
    return Response.json({ error: "Channel not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
