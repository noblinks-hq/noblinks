# Auth Integration — Implementation Plan

## Summary

Replace stubbed/hardcoded user data with real Better Auth data across the Noblinks product UI. Protect product routes with authentication, wire settings and profile pages to live session data.

---

## Phase 1: Protect Product Routes

### 1a — Update proxy.ts (optimistic cookie-based protection)
**File:** `src/proxy.ts`
- [x] Add product routes to matcher: `/overview`, `/machines`, `/alerts`, `/settings`
- [x] Change redirect target from `/` to `/login`

### 1b — Update session.ts (server-side protection config)
**File:** `src/lib/session.ts`
- [x] Add product routes to `protectedRoutes` array
- [x] Change `redirect("/")` to `redirect("/login")` in `requireAuth()`

### 1c — Add server-side auth check to product layout
**File:** `src/app/(product)/layout.tsx`
- [x] Call `requireAuth()` at the top of the server component before rendering `DashboardLayout`

---

## Phase 2: Settings Page — Real User Data

**File:** `src/app/(product)/settings/page.tsx`
- [x] Import `useSession` from `@/lib/auth-client`
- [x] Replace hardcoded "My Organization" with user's name (or "Personal Account" fallback)
- [x] Replace hardcoded "team@example.com" placeholder with user's actual email
- [x] Add loading skeleton while session loads

---

## Phase 3: Profile Page — Replace Stubs

### 3a — Export additional Better Auth client methods
**File:** `src/lib/auth-client.ts`
- [x] Export `updateUser` for profile name updates
- [x] Export `listSessions` for active sessions count
- [x] Export `revokeOtherSessions` for session management
- [x] Export `changePassword` for password changes

### 3b — Implement real profile update
**File:** `src/app/profile/page.tsx`
- [x] Replace `handleEditProfileSubmit` stub with real `authClient.updateUser({ name })` call
- [x] Show success/error toast based on result
- [x] Refresh session after successful update

### 3c — Fix sessions display
**File:** `src/app/profile/page.tsx`
- [x] Fetch real session list using `listSessions()` on mount
- [x] Replace hardcoded "1 Active" badge with actual session count
- [x] Replace "Active now" with real session info

### 3d — Clean up password section
**File:** `src/app/profile/page.tsx`
- [x] Remove naive `@gmail` check for OAuth detection
- [x] Show "Change Password" button (email/password auth only)
- [x] Wire up password change dialog using `changePassword()` from Better Auth

### 3e — Redirect behavior
**File:** `src/app/profile/page.tsx`
- [x] Change redirect target from `/` to `/login`

---

## Phase 4: Redirect Consistency

- [x] Review `UserProfile` sign-out redirect — keep as `/` (landing page after sign-out is correct)
- [x] Confirm only unauthenticated access to protected routes redirects to `/login`

---

## Files to Modify

| File | Change |
|------|--------|
| `src/proxy.ts` | Add product routes to matcher, redirect to `/login` |
| `src/lib/session.ts` | Add product routes, redirect to `/login` |
| `src/app/(product)/layout.tsx` | Add `requireAuth()` call |
| `src/app/(product)/settings/page.tsx` | Use `useSession()` for real user data |
| `src/lib/auth-client.ts` | Export `updateUser`, `listSessions`, `revokeOtherSessions`, `changePassword` |
| `src/app/profile/page.tsx` | Real profile update, real sessions, password change, redirect to `/login` |

---

## Verification

- [ ] Unauthenticated access to `/overview` redirects to `/login` *(manual)*
- [ ] Authenticated access to `/overview` loads normally *(manual)*
- [ ] Settings page shows real user name and email *(manual)*
- [ ] Profile edit persists name change after refresh *(manual)*
- [ ] Security dialog shows actual session count *(manual)*
- [x] `pnpm run lint && pnpm run typecheck` passes
