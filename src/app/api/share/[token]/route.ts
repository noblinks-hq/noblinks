import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dashboard, widget } from "@/lib/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [found] = await db
    .select()
    .from(dashboard)
    .where(eq(dashboard.publicToken, token));

  if (!found) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const widgets = await db
    .select()
    .from(widget)
    .where(eq(widget.dashboardId, found.id))
    .orderBy(widget.createdAt);

  return Response.json({ dashboard: found, widgets });
}
