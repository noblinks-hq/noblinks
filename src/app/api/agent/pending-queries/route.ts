import { and, eq } from "drizzle-orm";
import { requireAgentAuth } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { agentQuery } from "@/lib/schema";

export async function GET(request: Request) {
  const { machine: m, error } = await requireAgentAuth(request);
  if (error) return error;

  const pending = await db
    .select({ id: agentQuery.id, promql: agentQuery.promql })
    .from(agentQuery)
    .where(
      and(
        eq(agentQuery.organizationId, m.organizationId),
        eq(agentQuery.machineName, m.name),
        eq(agentQuery.status, "pending")
      )
    );

  return Response.json({ queries: pending });
}
