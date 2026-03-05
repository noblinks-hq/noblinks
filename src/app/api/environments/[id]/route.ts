import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { environment } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  await db
    .delete(environment)
    .where(
      and(
        eq(environment.id, id),
        eq(environment.organizationId, orgScope(session))
      )
    );

  return Response.json({ ok: true });
}
