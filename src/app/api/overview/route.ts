import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { alert, alertEvent, machine } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

interface Suggestion {
  machineName: string;
  metricKey: string;
  message: string;
  severity: string;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/**
 * Generates human-readable insight messages from metric trend data.
 * Only known metric categories produce messages; unknown metrics are skipped.
 */
function buildSuggestions(
  rows: Array<{
    machineName: string;
    metricKey: string;
    recentAvg: number;
    olderAvg: number;
  }>
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const row of rows) {
    const { machineName, metricKey, recentAvg, olderAvg } = row;

    // Skip if older average is zero to avoid division by zero
    if (olderAvg === 0) continue;

    const changePercent = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);

    // Only report significant increases
    if (changePercent < 15) continue;

    const key = metricKey.toLowerCase();
    const val = recentAvg;
    const machineBold = `**${machineName}**`;
    let message: string | null = null;

    if (key.includes("memory") || key.includes("mem")) {
      message = `Memory usage on ${machineBold} has increased ${changePercent}% in the last 2 hours (now at ${val.toFixed(1)}%). You may need to add more RAM or investigate memory leaks.`;
    } else if (key.includes("cpu")) {
      message = `CPU usage on ${machineBold} has risen ${changePercent}% recently (now at ${val.toFixed(1)}%). Consider investigating runaway processes or scaling up.`;
    } else if (key.includes("disk")) {
      message = `Disk usage on ${machineBold} is climbing fast — up ${changePercent}% recently (now at ${val.toFixed(1)}%). Consider cleaning up logs or expanding storage.`;
    } else if (key.includes("load")) {
      message = `System load on ${machineBold} has increased ${changePercent}% (current: ${val.toFixed(2)}). The machine may be under stress.`;
    } else if (key.includes("swap")) {
      message = `Swap usage on ${machineBold} has jumped ${changePercent}% (now at ${val.toFixed(1)}%). High swap often indicates memory pressure.`;
    } else if (key.includes("network") || key.includes("net")) {
      message = `Network activity on ${machineBold} has increased ${changePercent}% — could indicate a traffic spike or misconfigured service.`;
    }

    // Skip unknown metric types
    if (!message) continue;

    const severity =
      recentAvg > 90 || changePercent > 60
        ? "critical"
        : recentAvg > 70 || changePercent > 30
          ? "warning"
          : "info";

    suggestions.push({ machineName, metricKey, message, severity });
  }

  // Sort by severity (critical first), then limit to 8
  suggestions.sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2)
  );

  return suggestions.slice(0, 8);
}

export async function GET() {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const orgId = orgScope(session);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Run all queries in parallel for better performance
  const [firingAlerts, recentEvents, offlineMachines, trendRows] =
    await Promise.all([
      // 1. Firing alerts
      db
        .select()
        .from(alert)
        .where(
          and(
            eq(alert.organizationId, orgId),
            eq(alert.status, "firing")
          )
        )
        .orderBy(desc(alert.firedAt))
        .limit(20),

      // 2. Recent alert events (last 24h) with alert details
      db
        .select({
          alertId: alertEvent.alertId,
          event: alertEvent.event,
          occurredAt: alertEvent.occurredAt,
          alertName: alert.name,
          alertMachine: alert.machine,
          alertSeverity: alert.severity,
          alertStatus: alert.status,
        })
        .from(alertEvent)
        .innerJoin(alert, eq(alertEvent.alertId, alert.id))
        .where(
          and(
            eq(alert.organizationId, orgId),
            gte(alertEvent.occurredAt, twentyFourHoursAgo)
          )
        )
        .orderBy(desc(alertEvent.occurredAt))
        .limit(30),

      // 3. Offline machines
      db
        .select()
        .from(machine)
        .where(
          and(
            eq(machine.organizationId, orgId),
            eq(machine.status, "offline")
          )
        )
        .orderBy(desc(machine.lastSeen))
        .limit(20),

      // 4. Metric trend query for detecting rapidly changing metrics
      db.execute(sql`
        SELECT
          machine_name as "machineName",
          metric_key as "metricKey",
          AVG(CASE WHEN sampled_at > NOW() - INTERVAL '2 hours' THEN value END) as "recentAvg",
          AVG(CASE WHEN sampled_at <= NOW() - INTERVAL '2 hours' THEN value END) as "olderAvg"
        FROM metric_sample
        WHERE organization_id = ${orgId}
          AND sampled_at > NOW() - INTERVAL '24 hours'
        GROUP BY machine_name, metric_key
        HAVING
          COUNT(*) >= 5
          AND AVG(CASE WHEN sampled_at > NOW() - INTERVAL '2 hours' THEN value END) IS NOT NULL
          AND AVG(CASE WHEN sampled_at <= NOW() - INTERVAL '2 hours' THEN value END) IS NOT NULL
      `),
    ]);

  // 5. Generate insights from trend data
  const trendData = (trendRows as unknown as Array<{
    machineName: string;
    metricKey: string;
    recentAvg: string;
    olderAvg: string;
  }>).map((r) => ({
    machineName: r.machineName,
    metricKey: r.metricKey,
    recentAvg: parseFloat(r.recentAvg),
    olderAvg: parseFloat(r.olderAvg),
  }));

  const suggestions = buildSuggestions(trendData);

  return Response.json({
    firingAlerts,
    recentEvents,
    offlineMachines,
    suggestions,
  });
}
