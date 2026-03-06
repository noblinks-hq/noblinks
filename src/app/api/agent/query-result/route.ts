import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAgentAuth } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { agentQuery } from "@/lib/schema";

const bodySchema = z.object({
  id: z.string().uuid(),
  result: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export async function POST(request: Request) {
  const { machine: m, error } = await requireAgentAuth(request);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { id, result, error: queryError } = parsed.data;

  // Verify this query belongs to this machine/org
  const [row] = await db
    .select()
    .from(agentQuery)
    .where(
      and(
        eq(agentQuery.id, id),
        eq(agentQuery.organizationId, m.organizationId),
        eq(agentQuery.machineName, m.name)
      )
    );

  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(agentQuery)
    .set({
      status: queryError ? "failed" : "completed",
      result: result ?? null,
      completedAt: new Date(),
    })
    .where(eq(agentQuery.id, id));

  return Response.json({ ok: true });
}
