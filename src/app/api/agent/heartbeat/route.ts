import { eq } from "drizzle-orm";
import { requireAgentAuth } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { machine } from "@/lib/schema";

export async function POST(request: Request) {
  const { machine: m, error } = await requireAgentAuth(request);
  if (error) return error;

  await db
    .update(machine)
    .set({ status: "online", lastSeen: new Date() })
    .where(eq(machine.id, m.id));

  return Response.json({ ok: true });
}
