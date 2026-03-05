import { and, eq, isNotNull } from "drizzle-orm";
import { requireAgentAuth } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { monitoringCapability, widget } from "@/lib/schema";

/**
 * GET /api/agent/metrics-config
 *
 * Returns the list of { key, promql } pairs this machine needs to scrape,
 * derived from the widgets that exist for this org + machine name.
 * Only includes widgets backed by a capability that has a scrapeQuery.
 */
export async function GET(request: Request) {
  const { machine: m, error } = await requireAgentAuth(request);
  if (error) return error;

  // Find all widgets for this machine in this org that have a capabilityKey
  const widgets = await db
    .select({
      metricKey: widget.metric,
      capabilityKey: widget.capabilityKey,
    })
    .from(widget)
    .where(
      and(
        eq(widget.organizationId, m.organizationId),
        eq(widget.machine, m.name),
        isNotNull(widget.capabilityKey)
      )
    );

  if (widgets.length === 0) {
    return Response.json({ metrics: [] });
  }

  // Deduplicate by metricKey — one scrape per unique metric, not per widget
  const uniqueMetricKeys = [...new Set(widgets.map((w) => w.metricKey))];

  // Look up the scrapeQuery for each unique metric via the capabilities table
  const needed: { key: string; promql: string }[] = [];

  for (const metricKey of uniqueMetricKeys) {
    const widgetRow = widgets.find((w) => w.metricKey === metricKey);
    if (!widgetRow?.capabilityKey) continue;

    const [cap] = await db
      .select({ scrapeQuery: monitoringCapability.scrapeQuery })
      .from(monitoringCapability)
      .where(eq(monitoringCapability.capabilityKey, widgetRow.capabilityKey))
      .limit(1);

    if (cap?.scrapeQuery) {
      needed.push({ key: metricKey, promql: cap.scrapeQuery });
    }
  }

  return Response.json({ metrics: needed });
}
