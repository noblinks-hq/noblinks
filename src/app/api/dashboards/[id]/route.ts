import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { dashboard } from "@/lib/schema";
import { requireApiPermission } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiPermission({
    dashboard: ["update"],
  });
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { name, environment, category } = body as {
    name?: string;
    environment?: string;
    category?: string;
  };

  const updates: Record<string, string> = {};

  if (name !== undefined) {
    if (!name.trim()) {
      return Response.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    updates.name = name.trim();
  }

  if (environment !== undefined) {
    if (!environment.trim()) {
      return Response.json(
        { error: "Environment cannot be empty" },
        { status: 400 }
      );
    }
    updates.environment = environment.trim();
  }

  if (category !== undefined) {
    const validCategories = [
      "infrastructure",
      "docker",
      "kubernetes",
      "custom",
    ];
    if (!validCategories.includes(category)) {
      return Response.json(
        { error: `Category must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }
    updates.category = category;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(dashboard)
    .set(updates)
    .where(
      and(
        eq(dashboard.id, id),
        eq(dashboard.organizationId, orgScope(session))
      )
    )
    .returning();

  if (!updated) {
    return Response.json({ error: "Dashboard not found" }, { status: 404 });
  }

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiPermission({
    dashboard: ["delete"],
  });
  if (error) return error;

  const { id } = await params;

  const [deleted] = await db
    .delete(dashboard)
    .where(
      and(
        eq(dashboard.id, id),
        eq(dashboard.organizationId, orgScope(session))
      )
    )
    .returning();

  if (!deleted) {
    return Response.json({ error: "Dashboard not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
