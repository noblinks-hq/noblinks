// DEV ONLY — remove before production
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { setOrgLensPlan, type LensPlan } from "@/lib/plan";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available in production" }, { status: 403 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (new URL(request.url).searchParams.get("plan") ?? "starter") as LensPlan;
  if (!["none", "starter", "growth"].includes(plan)) {
    return Response.json({ error: "Invalid plan. Use: none, starter, growth" }, { status: 400 });
  }

  let orgId = session.session.activeOrganizationId ?? "";
  if (!orgId) {
    const orgs = await auth.api.listOrganizations({ headers: await headers() });
    orgId = orgs?.[0]?.id ?? "";
  }

  await setOrgLensPlan(orgId, plan);
  return Response.json({ ok: true, plan, orgId });
}
