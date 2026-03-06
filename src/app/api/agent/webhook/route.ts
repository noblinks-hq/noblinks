import { and, eq, inArray, sql } from "drizzle-orm";
import { requireAgentAuth } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { notifyAlert } from "@/lib/notify";
import { alert, alertEvent, organization } from "@/lib/schema";

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

  // Fetch org notification email once
  const [org] = await db
    .select({ notificationEmail: organization.notificationEmail })
    .from(organization)
    .where(eq(organization.id, m.organizationId))
    .limit(1);
  const notificationEmail = org?.notificationEmail ?? null;

  const now = new Date();

  if (firing.length > 0) {
    const updated = await db
      .update(alert)
      .set({ status: "firing", firedAt: now })
      .where(and(inArray(alert.id, firing), orgAndMachineFilter))
      .returning();
    processed += updated.length;

    if (updated.length > 0) {
      await db.insert(alertEvent).values(
        updated.map((a) => ({ alertId: a.id, event: "fired", occurredAt: now }))
      );
      // Prune to last 30 events per alert
      for (const a of updated) {
        await db.delete(alertEvent).where(
          and(
            eq(alertEvent.alertId, a.id),
            sql`${alertEvent.id} NOT IN (
              SELECT id FROM ${alertEvent}
              WHERE alert_id = ${a.id}
              ORDER BY occurred_at DESC
              LIMIT 30
            )`
          )
        );
      }
    }

    for (const a of updated) {
      if (!a.notifyOnFire) continue;
      await notifyAlert({
        organizationId: m.organizationId,
        alertId: a.id,
        alertName: a.name,
        machine: a.machine,
        severity: a.severity,
        threshold: a.threshold,
        status: "firing",
        legacyEmail: notificationEmail,
      });
    }
  }

  if (resolved.length > 0) {
    const updated = await db
      .update(alert)
      .set({ status: "resolved", resolvedAt: now })
      .where(and(inArray(alert.id, resolved), orgAndMachineFilter))
      .returning();
    processed += updated.length;

    if (updated.length > 0) {
      await db.insert(alertEvent).values(
        updated.map((a) => ({ alertId: a.id, event: "resolved", occurredAt: now }))
      );
      // Prune to last 30 events per alert
      for (const a of updated) {
        await db.delete(alertEvent).where(
          and(
            eq(alertEvent.alertId, a.id),
            sql`${alertEvent.id} NOT IN (
              SELECT id FROM ${alertEvent}
              WHERE alert_id = ${a.id}
              ORDER BY occurred_at DESC
              LIMIT 30
            )`
          )
        );
      }
    }

    for (const a of updated) {
      if (!a.notifyOnResolve) continue;
      await notifyAlert({
        organizationId: m.organizationId,
        alertId: a.id,
        alertName: a.name,
        machine: a.machine,
        severity: a.severity,
        threshold: a.threshold,
        status: "resolved",
        legacyEmail: notificationEmail,
      });
    }
  }

  return Response.json({ ok: true, processed });
}
