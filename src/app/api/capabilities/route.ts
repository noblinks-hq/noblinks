import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { monitoringCapability } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

export async function GET(request: Request) {
  const { error } = await requireApiAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const capabilities = category
    ? await db
        .select()
        .from(monitoringCapability)
        .where(eq(monitoringCapability.category, category))
    : await db.select().from(monitoringCapability);

  return Response.json({ capabilities });
}
