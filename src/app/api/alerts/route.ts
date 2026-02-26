import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { alert, monitoringCapability } from "@/lib/schema";
import { requireApiAuth, requireApiPermission } from "@/lib/session";

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const conditions = [eq(alert.organizationId, orgScope(session))];
  if (status) {
    conditions.push(eq(alert.status, status));
  }

  const alerts = await db
    .select()
    .from(alert)
    .where(and(...conditions))
    .orderBy(alert.createdAt);

  return Response.json({ alerts });
}

const VALID_SEVERITIES = ["critical", "warning", "info"];
const WINDOW_PATTERN = /^\d+[smhd]$/; // e.g. 5m, 1h, 30s, 1d

function fillTemplate(template: string, params: { machine: string; threshold: number; window: string }): string {
  return template
    .replace(/\$machine/g, params.machine)
    .replace(/\$threshold/g, String(params.threshold))
    .replace(/\$window/g, params.window);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiPermission({
    alert: ["create"],
  });
  if (error) return error;

  const body = await request.json();
  const { capabilityKey, machine, threshold, window, severity, name, description, force } = body as {
    capabilityKey?: string;
    machine?: string;
    threshold?: number;
    window?: string;
    severity?: string;
    name?: string;
    description?: string;
    force?: boolean;
  };

  // Validate required fields
  if (!capabilityKey?.trim()) {
    return Response.json({ error: "capabilityKey is required" }, { status: 400 });
  }
  if (!machine?.trim()) {
    return Response.json({ error: "machine is required" }, { status: 400 });
  }
  if (threshold === undefined || typeof threshold !== "number") {
    return Response.json({ error: "threshold must be a number" }, { status: 400 });
  }
  if (!window?.trim() || !WINDOW_PATTERN.test(window)) {
    return Response.json(
      { error: "window must be a duration like 5m, 1h, 30s" },
      { status: 400 }
    );
  }
  if (severity && !VALID_SEVERITIES.includes(severity)) {
    return Response.json(
      { error: `severity must be one of: ${VALID_SEVERITIES.join(", ")}` },
      { status: 400 }
    );
  }

  // Find the capability
  const [capability] = await db
    .select()
    .from(monitoringCapability)
    .where(eq(monitoringCapability.capabilityKey, capabilityKey));

  if (!capability) {
    return Response.json({ error: "Capability not found" }, { status: 404 });
  }

  // Check for duplicate alert (same org + capability + machine)
  if (!force) {
    const [existing] = await db
      .select({ id: alert.id, name: alert.name })
      .from(alert)
      .where(
        and(
          eq(alert.organizationId, orgScope(session)),
          eq(alert.capabilityId, capability.id),
          eq(alert.machine, machine.trim())
        )
      )
      .limit(1);

    if (existing) {
      return Response.json(
        {
          error: "duplicate",
          message: `An alert "${existing.name}" already exists for this capability and machine.`,
          existingAlertId: existing.id,
        },
        { status: 409 }
      );
    }
  }

  // Generate PromQL from template
  const promqlQuery = fillTemplate(capability.alertTemplate, {
    machine: machine.trim(),
    threshold,
    window,
  });

  // Auto-generate name and description if not provided
  const alertName = name?.trim() || `${capability.name} - ${machine.trim()}`;
  const alertDescription =
    description?.trim() ||
    `${capability.description} (threshold: ${threshold}%, window: ${window})`;

  const [created] = await db
    .insert(alert)
    .values({
      organizationId: orgScope(session),
      name: alertName,
      description: alertDescription,
      capabilityId: capability.id,
      machine: machine.trim(),
      threshold,
      window,
      severity: severity || capability.suggestedSeverity,
      promqlQuery,
      createdBy: session.user.id,
    })
    .returning();

  return Response.json({ alert: created }, { status: 201 });
}
