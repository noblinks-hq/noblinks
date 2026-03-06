import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { machine, metricSample } from "@/lib/schema";

// Called daily by Vercel Cron (see vercel.json).
// 1. Deletes metric_sample rows older than 24 hours.
// 2. Marks machines offline if lastSeen is older than 2 minutes.
// Protected by CRON_SECRET env var when set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // Delete metric samples older than 24 hours
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(metricSample)
    .where(lt(metricSample.sampledAt, cutoff24h))
    .returning({ id: metricSample.id });

  // Mark stale machines (lastSeen > 2 min ago) as offline
  const staleThreshold = new Date(now.getTime() - 2 * 60 * 1000);
  const offlined = await db
    .update(machine)
    .set({ status: "offline" })
    .where(
      and(
        eq(machine.status, "online"),
        isNotNull(machine.lastSeen),
        lt(machine.lastSeen, staleThreshold)
      )
    )
    .returning({ id: machine.id });

  return Response.json({
    ok: true,
    samplesDeleted: deleted.length,
    machinesMarkedOffline: offlined.length,
    cutoff: cutoff24h.toISOString(),
  });
}
