import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { dashboard } from "@/lib/schema";
import { requireApiAuth, requireApiPermission } from "@/lib/session";

export async function GET() {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const dashboards = await db
    .select()
    .from(dashboard)
    .where(eq(dashboard.organizationId, orgScope(session)));

  return Response.json(dashboards);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiPermission({
    dashboard: ["create"],
  });
  if (error) return error;

  const body = await request.json();
  const { name, environment, category } = body as {
    name?: string;
    environment?: string;
    category?: string;
  };

  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (!environment?.trim()) {
    return Response.json({ error: "Environment is required" }, { status: 400 });
  }

  const validCategories = ["infrastructure", "docker", "kubernetes", "custom"];
  if (!category || !validCategories.includes(category)) {
    return Response.json(
      { error: `Category must be one of: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(dashboard)
    .values({
      name: name.trim(),
      environment: environment.trim(),
      category,
      organizationId: orgScope(session),
      createdBy: session.user.id,
    })
    .returning();

  return Response.json(created, { status: 201 });
}
