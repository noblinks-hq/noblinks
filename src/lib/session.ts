import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Protected routes that require authentication.
 * These are also configured in src/proxy.ts for optimistic redirects.
 */
export const protectedRoutes = ["/chat", "/dashboard", "/profile", "/overview", "/machines", "/alerts", "/settings"];

/**
 * Checks if the current request is authenticated.
 * Should be called in Server Components for protected routes.
 *
 * @returns The session object if authenticated
 * @throws Redirects to home page if not authenticated
 */
export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return session;
}

/**
 * Checks if the current request is authenticated AND has an active organization.
 * Should be called in Server Components for org-scoped protected routes.
 *
 * @returns The session object if authenticated with an active org
 * @throws Redirects to /login if not authenticated, or /setup-organization if no active org
 */
export async function requireOrgAuth() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (!session.session.activeOrganizationId) {
    redirect("/setup-organization");
  }

  return session;
}

/**
 * Checks if the current user has the required permissions in the active organization.
 * Should be called in API routes that modify data.
 *
 * @param permissions - Record of resource to allowed actions (e.g. { machine: ["create"] })
 * @returns The session object if authorized
 * @throws Redirects if not authenticated, throws Error("Forbidden") if unauthorized
 */
export async function requirePermission(
  permissions: Record<string, string[]>
) {
  const session = await requireOrgAuth();

  const hasPermission = await auth.api.hasPermission({
    headers: await headers(),
    body: { permissions },
  });

  if (!hasPermission.success) {
    throw new Error("Forbidden");
  }

  return session;
}

/**
 * API-route-friendly auth check. Returns the session or a JSON error Response.
 * Use in route handlers where redirect() is not appropriate.
 *
 * @returns `{ session }` on success, or `{ session: null, error: Response }` on failure
 */
export async function requireApiAuth(): Promise<
  | { session: Awaited<ReturnType<typeof auth.api.getSession>> & {}; error: null }
  | { session: null; error: Response }
> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return {
      session: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!session.session.activeOrganizationId) {
    return {
      session: null,
      error: Response.json({ error: "No active organization" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

/**
 * API-route-friendly permission check. Returns the session or a JSON error Response.
 * Use in route handlers that modify org-scoped data.
 *
 * Example:
 * ```ts
 * export async function POST(request: Request) {
 *   const { session, error } = await requireApiPermission({ machine: ["create"] })
 *   if (error) return error
 *   // ... create machine scoped to session.session.activeOrganizationId
 * }
 * ```
 */
export async function requireApiPermission(
  permissions: Record<string, string[]>
): Promise<
  | { session: Awaited<ReturnType<typeof auth.api.getSession>> & {}; error: null }
  | { session: null; error: Response }
> {
  const result = await requireApiAuth();
  if (result.error) return result;

  const hasPermission = await auth.api.hasPermission({
    headers: await headers(),
    body: { permissions },
  });

  if (!hasPermission.success) {
    return {
      session: null,
      error: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

/**
 * Gets the current session without requiring authentication.
 * Returns null if not authenticated.
 *
 * @returns The session object or null
 */
export async function getOptionalSession() {
  return await auth.api.getSession({ headers: await headers() });
}

/**
 * Checks if a given path is a protected route.
 *
 * @param path - The path to check
 * @returns True if the path requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  return protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}
