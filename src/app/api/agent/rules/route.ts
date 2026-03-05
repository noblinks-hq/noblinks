import { and, eq, inArray } from "drizzle-orm";
import { requireAgentAuth } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { alert } from "@/lib/schema";

// Sanitise a string so it's safe to embed in a YAML scalar without quoting issues
function yamlStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// Build a valid Prometheus alert name: alphanumeric + underscore only
function alertName(name: string, machine: string): string {
  const base = `${name}_${machine}`.replace(/[^a-zA-Z0-9_]/g, "_");
  return base;
}

export async function GET(request: Request) {
  const { machine: m, error } = await requireAgentAuth(request);
  if (error) return error;

  const alerts = await db
    .select()
    .from(alert)
    .where(
      and(
        eq(alert.organizationId, m.organizationId),
        eq(alert.machine, m.name),
        inArray(alert.status, ["configured", "active"])
      )
    );

  if (alerts.length === 0) {
    const empty = `groups:\n  - name: noblinks\n    rules: []\n`;
    return new Response(empty, {
      headers: { "Content-Type": "text/yaml" },
    });
  }

  const rules = alerts
    .map((a) => {
      const name = alertName(a.name, a.machine);
      const summary = yamlStr(a.name);
      const desc = yamlStr(
        a.description ?? `${a.name} threshold exceeded on ${a.machine}`
      );
      return [
        `      - alert: ${name}`,
        `        expr: ${a.promqlQuery}`,
        `        for: ${a.window}`,
        `        labels:`,
        `          severity: "${yamlStr(a.severity)}"`,
        `          noblinks_alert_id: "${a.id}"`,
        `          noblinks_machine: "${yamlStr(a.machine)}"`,
        `          noblinks_org: "${yamlStr(a.organizationId)}"`,
        `        annotations:`,
        `          summary: "${summary}"`,
        `          description: "${desc}"`,
      ].join("\n");
    })
    .join("\n");

  const yaml = `groups:\n  - name: noblinks\n    rules:\n${rules}\n`;

  return new Response(yaml, {
    headers: { "Content-Type": "text/yaml" },
  });
}
