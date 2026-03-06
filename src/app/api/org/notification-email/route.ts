import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { organization } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

export async function GET() {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const [org] = await db
    .select({ notificationEmail: organization.notificationEmail })
    .from(organization)
    .where(eq(organization.id, orgScope(session)))
    .limit(1);

  return Response.json({ notificationEmail: org?.notificationEmail ?? null });
}

export async function PATCH(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const body = (await request.json()) as { notificationEmail?: string };
  const email = body.notificationEmail?.trim() ?? null;

  await db
    .update(organization)
    .set({ notificationEmail: email || null })
    .where(eq(organization.id, orgScope(session)));

  return Response.json({ notificationEmail: email });
}
