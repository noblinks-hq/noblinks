import { and, eq, inArray } from "drizzle-orm";
import { requireAgentAuth } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { alert } from "@/lib/schema";

export async function PATCH(request: Request) {
  const { machine: m, error } = await requireAgentAuth(request);
  if (error) return error;

  const body = (await request.json()) as { activatedAlertIds?: string[] };

  if (!Array.isArray(body.activatedAlertIds) || body.activatedAlertIds.length === 0) {
    return Response.json({ error: "activatedAlertIds must be a non-empty array" }, { status: 400 });
  }

  const ids = body.activatedAlertIds.filter((id) => typeof id === "string");

  const result = await db
    .update(alert)
    .set({ status: "active" })
    .where(
      and(
        inArray(alert.id, ids),
        eq(alert.organizationId, m.organizationId),
        eq(alert.machine, m.name),
        eq(alert.status, "configured") // only promote configured → active
      )
    )
    .returning({ id: alert.id });

  return Response.json({ updated: result.length });
}
