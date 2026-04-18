import { requireApiAuth } from "@/lib/session";
import { lensDb } from "@/lib/lens/db";
import { lensAnalysis } from "@/lib/lens/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const records = await lensDb
    .select({
      id: lensAnalysis.id,
      targetCloud: lensAnalysis.targetCloud,
      inputMethod: lensAnalysis.inputMethod,
      status: lensAnalysis.status,
      scoringResult: lensAnalysis.scoringResult,
      matchResults: lensAnalysis.matchResults,
      createdAt: lensAnalysis.createdAt,
      updatedAt: lensAnalysis.updatedAt,
    })
    .from(lensAnalysis)
    .where(eq(lensAnalysis.userId, session.user.id))
    .orderBy(desc(lensAnalysis.createdAt));

  return Response.json(records);
}
