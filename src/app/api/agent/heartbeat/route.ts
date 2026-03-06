import { and, eq, isNotNull, lt, ne } from "drizzle-orm";
import { requireAgentAuth } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { machine } from "@/lib/schema";

const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
const AGENT_VERSION = process.env.AGENT_VERSION ?? null;

export async function POST(request: Request) {
  const { machine: m, error } = await requireAgentAuth(request);
  if (error) return error;

  // Parse optional body for version reporting
  let agentVersion: string | undefined;
  try {
    const body = (await request.json()) as { version?: string };
    agentVersion = body.version;
  } catch {
    // Body is optional
  }

  const now = new Date();

  const needsUpdate =
    AGENT_VERSION !== null &&
    agentVersion !== undefined &&
    agentVersion !== AGENT_VERSION;

  // Update current machine as online
  await db
    .update(machine)
    .set({
      status: "online",
      lastSeen: now,
      ...(agentVersion !== undefined && { agentVersion }),
      needsUpdate,
    })
    .where(eq(machine.id, m.id));

  // Opportunistically mark other stale machines in the same org as offline
  const staleThreshold = new Date(now.getTime() - STALE_THRESHOLD_MS);
  await db
    .update(machine)
    .set({ status: "offline" })
    .where(
      and(
        eq(machine.organizationId, m.organizationId),
        ne(machine.id, m.id),
        eq(machine.status, "online"),
        isNotNull(machine.lastSeen),
        lt(machine.lastSeen, staleThreshold)
      )
    );

  return Response.json({ ok: true, latestVersion: AGENT_VERSION });
}
