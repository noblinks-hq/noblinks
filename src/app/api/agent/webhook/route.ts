import { and, eq, inArray } from "drizzle-orm";
import { requireAgentAuth } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { alert } from "@/lib/schema";

interface AlertmanagerAlert {
  status: "firing" | "resolved";
  labels: Record<string, string>;
  startsAt?: string;
  endsAt?: string;
}

interface AlertmanagerPayload {
  version?: string;
  status?: "firing" | "resolved";
  alerts?: AlertmanagerAlert[];
}

export async function POST(request: Request) {
  const { machine: m, error } = await requireAgentAuth(request);
  if (error) return error;

  const payload = (await request.json()) as AlertmanagerPayload;

  if (!Array.isArray(payload.alerts) || payload.alerts.length === 0) {
    return Response.json({ ok: true, processed: 0 });
  }

  // Group alerts by their new status
  const firing: string[] = [];
  const resolved: string[] = [];

  for (const a of payload.alerts) {
    const alertId = a.labels?.noblinks_alert_id;
    if (!alertId) continue;

    // Tenant boundary check: org from the label must match the authenticated machine's org
    const labelOrg = a.labels?.noblinks_org;
    if (labelOrg && labelOrg !== m.organizationId) continue;

    if (a.status === "firing") {
      firing.push(alertId);
    } else if (a.status === "resolved") {
      resolved.push(alertId);
    }
  }

  const orgAndMachineFilter = and(
    eq(alert.organizationId, m.organizationId),
    eq(alert.machine, m.name)
  );

  let processed = 0;

  if (firing.length > 0) {
    const r = await db
      .update(alert)
      .set({ status: "firing" })
      .where(and(inArray(alert.id, firing), orgAndMachineFilter))
      .returning({ id: alert.id });
    processed += r.length;
  }

  if (resolved.length > 0) {
    const r = await db
      .update(alert)
      .set({ status: "resolved" })
      .where(and(inArray(alert.id, resolved), orgAndMachineFilter))
      .returning({ id: alert.id });
    processed += r.length;
  }

  return Response.json({ ok: true, processed });
}
