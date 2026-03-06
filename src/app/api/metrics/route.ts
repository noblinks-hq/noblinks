import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { metricSample } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

// Returns distinct { machineName, metricKey } pairs seen in the last 24 hours.
export async function GET() {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const metrics = await db
    .selectDistinct({
      machineName: metricSample.machineName,
      metricKey: metricSample.metricKey,
    })
    .from(metricSample)
    .where(
      and(
        eq(metricSample.organizationId, orgScope(session)),
        gt(metricSample.sampledAt, oneDayAgo)
      )
    )
    .orderBy(metricSample.machineName, metricSample.metricKey);

  return Response.json({ metrics });
}
