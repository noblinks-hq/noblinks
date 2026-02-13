import { authClient } from "./auth-client"
import type { auth } from "./auth"

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

/**
 * Extracts the active organization ID from a session.
 * Use this to scope all database queries to the current tenant.
 *
 * Example: `db.select().from(machines).where(eq(machines.organizationId, orgScope(session)))`
 */
export function orgScope(session: Session): string {
  const orgId = session.session.activeOrganizationId
  if (!orgId) throw new Error("No active organization")
  return orgId
}

/**
 * Generates a URL-safe slug from a string.
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Ensures the current user has an organization.
 * If none exists, creates one using their name or email prefix,
 * then sets it as the active organization.
 *
 * Call this client-side after login/signup.
 */
export async function ensureOrganization(user: {
  name: string
  email: string
}) {
  const { data: orgs } = await authClient.organization.list()

  const firstOrg = orgs?.[0]
  if (firstOrg) {
    // User already has an org — set it as active if not already
    await authClient.organization.setActive({
      organizationId: firstOrg.id,
    })
    return firstOrg
  }

  // No org yet — create one
  const orgName = user.name || user.email.split("@")[0] || "My Organization"
  const slug = toSlug(orgName) + "-" + Date.now().toString(36)

  const { data: newOrg } = await authClient.organization.create({
    name: orgName,
    slug,
  })

  if (newOrg) {
    await authClient.organization.setActive({
      organizationId: newOrg.id,
    })
  }

  return newOrg
}
