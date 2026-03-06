import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentQuery } from "@/lib/schema";

/**
 * Ask a connected machine a real-time Prometheus question.
 * Inserts a pending query into the DB; the agent picks it up on its next
 * poll cycle (every 5s), executes it against local Prometheus, and posts
 * the label values back.  We wait up to `timeoutMs` for the answer.
 *
 * Returns an array of label values (e.g. service names), or null on timeout/error.
 */
export async function queryMachineLabels(
  orgId: string,
  machineName: string,
  promql: string,
  timeoutMs = 8000
): Promise<string[] | null> {
  const [row] = await db
    .insert(agentQuery)
    .values({ organizationId: orgId, machineName, promql, status: "pending" })
    .returning();

  if (!row) return null;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1000));
    const [updated] = await db
      .select()
      .from(agentQuery)
      .where(eq(agentQuery.id, row.id));
    if (updated?.status === "completed" && Array.isArray(updated.result)) {
      return updated.result as string[];
    }
    if (updated?.status === "failed") return null;
  }

  // Mark timed-out so the agent skips it on the next poll
  await db
    .update(agentQuery)
    .set({ status: "timeout" })
    .where(eq(agentQuery.id, row.id));
  return null;
}
