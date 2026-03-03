import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { organization } from "@/lib/schema";
import { requireApiAuth, requireApiPermission } from "@/lib/session";

export async function GET() {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, orgScope(session)))
    .limit(1);

  if (!org) {
    return Response.json({ error: "Organization not found" }, { status: 404 });
  }

  let token = org.agentRegistrationToken;
  if (!token) {
    token = "nbl_reg_" + randomBytes(24).toString("hex");
    await db
      .update(organization)
      .set({ agentRegistrationToken: token })
      .where(eq(organization.id, org.id));
  }

  return Response.json({ token });
}

export async function POST() {
  const { session, error } = await requireApiPermission({
    organization: ["update"],
  });
  if (error) return error;

  const newToken = "nbl_reg_" + randomBytes(24).toString("hex");
  await db
    .update(organization)
    .set({ agentRegistrationToken: newToken })
    .where(eq(organization.id, orgScope(session)));

  return Response.json({ token: newToken });
}
