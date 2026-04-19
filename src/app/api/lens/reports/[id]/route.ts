import { requireApiAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { lensAnalysis } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  const [record] = await db
    .select()
    .from(lensAnalysis)
    .where(and(eq(lensAnalysis.id, id), eq(lensAnalysis.userId, session.user.id)))
    .limit(1);

  if (!record) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(record);
}
