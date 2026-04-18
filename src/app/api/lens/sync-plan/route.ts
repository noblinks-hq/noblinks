import { Polar } from "@polar-sh/sdk";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

async function syncPlan() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const userEmail = session.user.email;

  let orgId = session.session.activeOrganizationId ?? "";
  if (!orgId) {
    const orgs = await auth.api.listOrganizations({ headers: await headers() });
    orgId = orgs?.[0]?.id ?? "";
  }

  if (!orgId) return Response.json({ error: "No organization found" }, { status: 403 });

  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
    server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
  });

  // Debug: collect what Polar knows about this user
  const debug: Record<string, unknown> = { userId, userEmail, orgId };

  try {
    // Try by externalCustomerId (user.id)
    const byExternal: unknown[] = [];
    for await (const page of await polar.subscriptions.list({ externalCustomerId: userId })) {
      byExternal.push(...page.result.items.map((s) => ({ id: s.id, productId: s.productId, status: s.status, customerId: s.customerId })));
    }
    debug.byExternalCustomerId = byExternal;

    // Try by email
    const byEmail: unknown[] = [];
    for await (const page of await polar.subscriptions.list({ limit: 50 })) {
      byEmail.push(...page.result.items.map((s) => ({ id: s.id, productId: s.productId, status: s.status, customerId: s.customerId })));
    }
    debug.allSubscriptions = byEmail;

    // Try to find customer
    try {
      const customer = await polar.customers.getExternal({ externalId: userId });
      debug.customer = { id: customer.id, email: customer.email, externalId: customer.externalId };
    } catch (e) {
      debug.customerError = e instanceof Error ? e.message : String(e);
    }

    return Response.json(debug);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err), debug }, { status: 500 });
  }
}

export async function POST() { return syncPlan(); }
export async function GET()  { return syncPlan(); }
