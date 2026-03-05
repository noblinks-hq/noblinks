import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { environment } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

export async function GET() {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const envs = await db
    .select()
    .from(environment)
    .where(eq(environment.organizationId, orgScope(session)))
    .orderBy(environment.createdAt);

  return Response.json(envs);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const body = (await request.json()) as { name?: string };
  if (!body.name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const [created] = await db
    .insert(environment)
    .values({
      name: body.name.trim(),
      organizationId: orgScope(session),
    })
    .returning();

  return Response.json(created, { status: 201 });
}
