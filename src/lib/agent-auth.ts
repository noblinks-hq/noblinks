import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { machine } from "@/lib/schema";
import type { DbMachine } from "@/lib/types";

export async function requireAgentAuth(request: Request): Promise<
  | { machine: DbMachine; error: null }
  | { machine: null; error: Response }
> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return {
      machine: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const rawToken = auth.slice(7);
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const [found] = await db
    .select()
    .from(machine)
    .where(eq(machine.agentTokenHash, tokenHash))
    .limit(1);

  if (!found) {
    return {
      machine: null,
      error: Response.json({ error: "Invalid agent token" }, { status: 401 }),
    };
  }

  return {
    machine: {
      ...found,
      lastSeen: found.lastSeen?.toISOString() ?? null,
      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString(),
      category: found.category as DbMachine["category"],
    },
    error: null,
  };
}
