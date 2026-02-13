# IAM Extension — Organizations & RBAC (Using BetterAuth Organization Plugin)

## Objective

Extend the existing BetterAuth setup to support:

- Multi-tenant organizations
- Role-based access control (Owner / Admin / Member)
- Organization-bound data isolation

Authentication is already handled by BetterAuth.
We are only implementing authorization and tenant separation.

Use the existing PostgreSQL database and Drizzle ORM migration system.

This plan uses **BetterAuth's built-in organization plugin** (`better-auth/plugins`),
which is already installed at v1.4.18. We do NOT build custom organization tables or session logic.

---

# Current State

BetterAuth is integrated and working:

- Users can sign up and sign in (`src/lib/auth.ts`)
- `user`, `session`, `account`, `verification` tables exist (`src/lib/schema.ts`)
- Session cookies are signed with `BETTER_AUTH_SECRET`
- `useSession()` returns authenticated user (`src/lib/auth-client.ts`)
- `requireAuth()` protects server-side routes (`src/lib/session.ts`)
- Product data is currently mock/client-side (`src/context/noblinks-context.tsx`)

We now extend the system with the BetterAuth organization plugin.

---

# Phase 1 — Enable Organization Plugin (Server)

## Goal

Add the BetterAuth organization plugin to the server-side auth config with access control.

---

## File: `src/lib/auth.ts`

### Tasks

- [ ] Import `organization` from `"better-auth/plugins"`
- [ ] Import `createAccessControl` from `"better-auth/plugins/access"`
- [ ] Define access control statements for Noblinks domain resources:

```typescript
import { createAccessControl } from "better-auth/plugins/access"
import { organization } from "better-auth/plugins"

const statement = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  machine: ["create", "update", "delete", "view"],
  dashboard: ["create", "update", "delete", "view"],
  alert: ["view", "acknowledge"],
} as const

const ac = createAccessControl(statement)

const ownerRole = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  machine: ["create", "update", "delete", "view"],
  dashboard: ["create", "update", "delete", "view"],
  alert: ["view", "acknowledge"],
})

const adminRole = ac.newRole({
  member: ["create", "update"],
  invitation: ["create"],
  machine: ["create", "update", "delete", "view"],
  dashboard: ["create", "update", "view"],
  alert: ["view", "acknowledge"],
})

const memberRole = ac.newRole({
  machine: ["view"],
  dashboard: ["view"],
  alert: ["view"],
})
```

- [ ] Add the `organization()` plugin to the `betterAuth()` config:

```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true, /* ...existing config */ },
  emailVerification: { /* ...existing config */ },
  plugins: [
    organization({
      ac,
      roles: {
        owner: ownerRole,
        admin: adminRole,
        member: memberRole,
      },
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      organizationLimit: 1,
      sendInvitationEmail: async (data) => {
        // Log invitation to terminal (no email integration yet)
        // eslint-disable-next-line no-console
        console.log(
          `\n${"=".repeat(60)}\nORGANIZATION INVITATION\nEmail: ${data.email}\nOrganization: ${data.organization.name}\nRole: ${data.role}\nInvitation ID: ${data.id}\n${"=".repeat(60)}\n`
        )
      },
    }),
  ],
})
```

- [ ] Verify `pnpm run typecheck` passes after changes

---

# Phase 2 — Enable Organization Plugin (Client)

## Goal

Add the organization client plugin so client-side hooks are available.

---

## File: `src/lib/auth-client.ts`

### Tasks

- [ ] Import `organizationClient` from `"better-auth/client/plugins"`
- [ ] Add `organizationClient()` to the `createAuthClient` plugins array
- [ ] Export the new organization-related functions and hooks:

```typescript
import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [organizationClient()],
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
  updateUser,
  listSessions,
  revokeOtherSessions,
  changePassword,
  // Organization exports
  useActiveOrganization,
  useListOrganizations,
  organization,
} = authClient
```

- [ ] Verify `pnpm run typecheck` passes

---

# Phase 3 — Database Schema Update

## Goal

Add the plugin's required tables to the Drizzle schema and run migrations.

---

## Tables Created by Plugin

The organization plugin requires these tables:

1. **`organization`** — `id`, `name`, `slug`, `logo`, `createdAt`, `updatedAt`
2. **`member`** — `id`, `organizationId`, `userId`, `role`, `createdAt`
3. **`invitation`** — `id`, `organizationId`, `email`, `role`, `status`, `expiresAt`, `inviterId`, `createdAt`

The plugin also adds a field to the existing **`session`** table:

4. **`activeOrganizationId`** — `text`, nullable (tracks the user's currently active org)

### Tasks

- [x] Run `npx @better-auth/cli generate` to auto-generate the Drizzle schema additions
- [x] Review generated output and merge into `src/lib/schema.ts`
- [x] Ensure all new tables use `text("id")` primary keys (matching BetterAuth convention, NOT uuid)
- [x] Add `activeOrganizationId` field to the existing `session` table definition
- [x] Add proper foreign key references:
  - `member.organizationId` → `organization.id`
  - `member.userId` → `user.id`
  - `invitation.organizationId` → `organization.id`
  - `invitation.inviterId` → `user.id`
- [x] Add indexes on frequently queried columns:
  - `member`: index on `organizationId`, index on `userId`
  - `invitation`: index on `organizationId`, index on `email`
  - `session`: index on `activeOrganizationId`
- [x] Generate migration: `pnpm run db:generate`
- [x] Run migration: `pnpm run db:migrate`
- [x] Confirm all tables exist in database via `pnpm run db:studio`

### Important

- Do NOT add `organization_id` or `role` columns to the `user` table
- The `member` table is the junction table between users and organizations
- A user's role is stored per-organization in the `member` table, not globally on the user

---

# Phase 4 — Auto-Create Organization on First Login

## Goal

Automatically create an organization for new users who don't have one yet.

---

## Approach

Use BetterAuth's `databaseHooks` on session creation to check if the user has a membership.
If not, create an organization and set it as the active org on the session.

### File: `src/lib/auth.ts`

### Tasks

- [x] Add `databaseHooks` to the `betterAuth()` config:

```typescript
export const auth = betterAuth({
  // ...existing config
  plugins: [ /* ...organization plugin */ ],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const db = await import("./db").then((m) => m.db)
          const { member } = await import("./schema")

          // Check if user already has an org membership
          const memberships = await db
            .select()
            .from(member)
            .where(eq(member.userId, session.userId))
            .limit(1)

          if (memberships.length > 0) {
            // Set active org to their existing membership
            return {
              data: {
                ...session,
                activeOrganizationId: memberships[0].organizationId,
              },
            }
          }

          // No org yet — create one via plugin API
          // The organization will be created in afterCreate hook instead
          return { data: session }
        },
      },
    },
  },
})
```

- [x] Create a helper function `ensureOrganization()` in `src/lib/org.ts`:
  - Called after login on the client side (or via server action)
  - Uses `authClient.organization.create()` to create an org if user has none
  - Uses `authClient.organization.setActive()` to set it as active
  - Uses the user's name or email prefix as the org name
  - Generates a slug from the org name

- [ ] Test: New user signs up → org auto-created, user is `owner`
- [ ] Test: Existing user logs in → no duplicate org, session has `activeOrganizationId`

---

# Phase 5 — Session & Auth Helpers

## Goal

Extend session helpers to include organization context.

---

## File: `src/lib/session.ts`

### Tasks

- [x] Add `requireOrgAuth()` function that ensures both authentication AND active organization:

```typescript
export async function requireOrgAuth() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  if (!session.session.activeOrganizationId) {
    // User is authenticated but has no active org — redirect to org setup
    redirect("/setup-organization")
  }

  return session
}
```

- [x] Add `requirePermission()` helper for API routes:

```typescript
export async function requirePermission(
  permissions: Record<string, string[]>
) {
  const session = await requireOrgAuth()

  const hasPermission = await auth.api.hasPermission({
    headers: await headers(),
    body: { permissions },
  })

  if (!hasPermission.success) {
    throw new Error("Forbidden")
  }

  return session
}
```

- [x] Update `src/app/(product)/layout.tsx` to use `requireOrgAuth()` instead of `requireAuth()`
- [x] Verify session object includes `activeOrganizationId` field

---

# Phase 6 — RBAC Enforcement in API Routes

## Goal

Enforce role-based permissions on backend operations using the plugin's `hasPermission` API.

---

## Permission Matrix

| Action                 | Owner | Admin | Member |
| ---------------------- | ----- | ----- | ------ |
| Delete organiza
tion    | Yes   | No    | No     |
| Update organization    | Yes   | No    | No     |
| Invite users           | Yes   | Yes   | No     |
| Create/delete machines | Yes   | Yes   | No     |
| Update machines        | Yes   | Yes   | No     |
| View machines          | Yes   | Yes   | Yes    |
| Create/delete dashboards | Yes | Yes   | No     |
| View dashboards        | Yes   | Yes   | Yes    |
| View alerts            | Yes   | Yes   | Yes    |
| Acknowledge alerts     | Yes   | Yes   | No     |

### Tasks

- [x] Apply `requirePermission()` in each API route that modifies data:

```typescript
// Example: POST /api/machines
export async function POST(request: Request) {
  const session = await requirePermission({ machine: ["create"] })
  // ... create machine scoped to session.session.activeOrganizationId
}
```

- [x] Return HTTP 403 with JSON body `{ error: "Forbidden" }` on unauthorized actions
- [x] Ensure all permission checks happen server-side (frontend checks are UX-only)
- [x] Add permission checks to existing API routes as they are created

---

# Phase 7 — Organization Data Isolation

## Goal

Guarantee that all data queries are scoped to the user's active organization.

---

### Tasks

- [x] Every database table that holds tenant data MUST include an `organizationId` column:
  - Future `machines` table
  - Future `dashboards` table
  - Future `alerts` table
  - Future `widgets` table

- [x] Create a helper for org-scoped queries:

```typescript
// src/lib/org.ts
export function orgScope(session: Session) {
  const orgId = session.session.activeOrganizationId
  if (!orgId) throw new Error("No active organization")
  return orgId
}
```

- [x] All database queries MUST include:
  `WHERE organizationId = orgScope(session)`

- [x] Audit: when mock data (`src/context/noblinks-context.tsx`) is replaced with real DB queries,
  every query must be org-scoped from day one

- [ ] Test isolation with:
  - Two users in different organizations
  - Confirm User A cannot see User B's data
  - Confirm API returns only org-scoped results

---

# Phase 8 — Invite Flow (Using Plugin)

## Goal

Allow owners/admins to invite users to their organization using the plugin's invitation system.

---

### How It Works (Plugin Built-in)

1. Owner calls `authClient.organization.inviteMember({ email, role })`
2. Plugin creates an `invitation` record with status `pending`
3. `sendInvitationEmail` callback fires (currently logs to terminal)
4. Invited user signs up → accepts invitation → becomes a `member` of the org

### Tasks

- [x] Add invite form to Settings page (`src/app/(product)/settings/page.tsx`):
  - Email input
  - Role select (admin / member)
  - Submit calls `authClient.organization.inviteMember()`

- [x] Add invitation acceptance page/logic:
  - Route: `/invite/accept?id=<invitation_id>`
  - Calls `authClient.organization.acceptInvitation({ invitationId })`

- [x] Show pending invitations list in Settings page:
  - Uses `useActiveOrganization()` which includes `invitations` array
  - Owner can cancel pending invitations

- [ ] Test: Owner invites email → invitation created → user accepts → user is member of org

---

# Phase 9 — Wire Organization Data to Settings UI

## Goal

Replace hardcoded values in the Settings page with real organization data.

---

## File: `src/app/(product)/settings/page.tsx`

### Tasks

- [x] Use `useActiveOrganization()` hook to get real org data
- [x] Replace hardcoded "Personal Account" with `activeOrganization.name`
- [x] Replace hardcoded "Free" badge with org metadata (if plan is stored in org metadata)
- [x] Show member list from `activeOrganization.members`
- [x] Show member roles with the correct role from the `member` record
- [x] Wire "Delete Organization" button to `authClient.organization.delete()`
  - Only enabled for `owner` role
  - Add confirmation dialog before deletion

---

# Files Changed Summary

| File | Change |
| --- | --- |
| `src/lib/auth.ts` | Add organization plugin + access control + databaseHooks |
| `src/lib/auth-client.ts` | Add organizationClient plugin + export new hooks |
| `src/lib/schema.ts` | Add `organization`, `member`, `invitation` tables + `activeOrganizationId` on session |
| `src/lib/session.ts` | Add `requireOrgAuth()` and `requirePermission()` helpers |
| `src/lib/org.ts` | New file — `ensureOrganization()` helper and `orgScope()` utility |
| `src/app/(product)/layout.tsx` | Use `requireOrgAuth()` instead of `requireAuth()` |
| `src/app/(product)/settings/page.tsx` | Wire real org data, invite form, member list |

---

# Manual Validation Checklist

- [ ] New user signs up → organization auto-created → user is `owner`
- [ ] Existing user logs in → no duplicate org → session has `activeOrganizationId`
- [ ] `useActiveOrganization()` returns org with members and invitations
- [ ] Owner can invite users
- [ ] Invited user can accept invitation and become member
- [ ] Owner can delete organization
- [ ] Admin cannot delete organization (403)
- [ ] Member cannot create machines (403)
- [ ] All data queries are org-scoped (no cross-tenant leakage)
- [ ] `useSession()` session object includes `activeOrganizationId`
- [ ] No console errors
- [ ] `pnpm run lint` passes
- [ ] `pnpm run typecheck` passes

---

# Constraints

Do NOT:

- Modify BetterAuth internals or core source
- Add `organization_id` or `role` columns to the `user` table
- Build a custom session system (use the plugin's session enrichment)
- Build a custom invitation system (use the plugin's invitation flow)
- Build a custom permission checker (use `auth.api.hasPermission()`)
- Add row-level security policies in PostgreSQL
- Add billing integration in this phase
- Use UUID for plugin table IDs (BetterAuth uses `text` IDs)

---

# Key Differences from Previous Plan

| Aspect | Previous Plan | This Plan |
| --- | --- | --- |
| Organization table | Custom `organizations` table | Plugin-managed `organization` table |
| User-org relationship | `organization_id` on `user` table | Separate `member` junction table |
| Role storage | `role` column on `user` table | `role` per-membership in `member` table |
| Multi-org support | Impossible (1 org per user) | Supported (limited to 1 via config, but data model is correct) |
| Session enrichment | Custom wrapper around `getSession()` | Plugin adds `activeOrganizationId` to session table natively |
| Permission checking | Custom `requireRole()` function | `auth.api.hasPermission()` with typed access control |
| Invite flow | Create user record directly (insecure) | Plugin invitation system with proper states |
| ID types | UUID | Text (matching BetterAuth convention) |

---

# Definition of Done

- Every user belongs to at least one organization (via `member` table)
- Role is stored per-membership, not per-user
- Session includes `activeOrganizationId` natively
- Backend enforces permissions via `auth.api.hasPermission()`
- Data isolation guaranteed via org-scoped queries
- Invitation flow works end-to-end
- Settings page shows real organization data
- Authentication remains handled by BetterAuth core
- All changes use the official BetterAuth organization plugin
