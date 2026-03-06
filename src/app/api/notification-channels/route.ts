import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { notificationChannel } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

const VALID_TYPES = ["email", "slack"];

export async function GET() {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const channels = await db
    .select()
    .from(notificationChannel)
    .where(eq(notificationChannel.organizationId, orgScope(session)))
    .orderBy(notificationChannel.createdAt);

  return Response.json({ channels });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const body = await request.json();
  const { name, type, config } = body as {
    name?: string;
    type?: string;
    config?: Record<string, string>;
  };

  if (!name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (!type || !VALID_TYPES.includes(type)) {
    return Response.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (type === "email") {
    if (!config?.email?.trim()) {
      return Response.json({ error: "config.email is required for email channels" }, { status: 400 });
    }
  } else if (type === "slack") {
    if (!config?.webhookUrl?.trim()) {
      return Response.json({ error: "config.webhookUrl is required for slack channels" }, { status: 400 });
    }
  }

  const [created] = await db
    .insert(notificationChannel)
    .values({
      organizationId: orgScope(session),
      name: name.trim(),
      type,
      config: config ?? {},
    })
    .returning();

  return Response.json({ channel: created }, { status: 201 });
}
