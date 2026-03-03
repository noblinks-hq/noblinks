import { randomBytes, createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { organization, machine } from "@/lib/schema";

export async function POST(request: Request) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orgToken = auth.slice(7);

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.agentRegistrationToken, orgToken))
    .limit(1);

  if (!org) {
    return Response.json(
      { error: "Invalid registration token" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as {
    machineName?: string;
    hostname?: string;
    ip?: string;
    agentVersion?: string;
  };

  if (!body.machineName?.trim()) {
    return Response.json(
      { error: "machineName is required" },
      { status: 400 }
    );
  }

  const rawToken = "nbl_agt_" + randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const now = new Date();

  const [existing] = await db
    .select()
    .from(machine)
    .where(
      and(
        eq(machine.organizationId, org.id),
        eq(machine.name, body.machineName.trim())
      )
    )
    .limit(1);

  let machineRecord;
  if (existing) {
    [machineRecord] = await db
      .update(machine)
      .set({
        hostname: body.hostname ?? null,
        ip: body.ip ?? null,
        agentVersion: body.agentVersion ?? null,
        agentTokenHash: tokenHash,
        status: "online",
        lastSeen: now,
      })
      .where(eq(machine.id, existing.id))
      .returning();
  } else {
    [machineRecord] = await db
      .insert(machine)
      .values({
        organizationId: org.id,
        name: body.machineName.trim(),
        hostname: body.hostname ?? null,
        ip: body.ip ?? null,
        agentVersion: body.agentVersion ?? null,
        agentTokenHash: tokenHash,
        status: "online",
        lastSeen: now,
      })
      .returning();
  }

  return Response.json(
    { machineId: machineRecord!.id, agentToken: rawToken },
    { status: 201 }
  );
}
