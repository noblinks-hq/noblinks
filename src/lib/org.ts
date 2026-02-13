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
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Creates an organization and sets it as active.
 * Call this from /setup-organization after user provides a name.
 */
export async function createOrganization(name: string) {
  const slug = toSlug(name) + "-" + Date.now().toString(36)

  const { data: newOrg, error } = await authClient.organization.create({
    name,
    slug,
  })

  if (error || !newOrg) {
    throw new Error(error?.message || "Failed to create organization")
  }

  await authClient.organization.setActive({
    organizationId: newOrg.id,
  })

  return newOrg
}
