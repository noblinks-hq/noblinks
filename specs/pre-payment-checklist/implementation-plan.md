# Pre-Payment Checklist — Implementation Plan

## Status
**TODO** — Several non-feature requirements must be in place before charging real users.

---

## 1. Rate Limiting

**Problem:** All API routes are open to abuse. A bad actor can hammer `/api/agent/metrics` or `/api/auth/checkout`.

**What to build:**
- Add Upstash Redis + `@upstash/ratelimit` (or use Vercel's built-in rate limiting middleware)
- Apply limits per IP on auth routes (10 req/min) and agent routes (60 req/min)
- Return `429 Too Many Requests` with `Retry-After` header

**Files:** `src/middleware.ts` or per-route in API handlers

---

## 2. Error Monitoring

**Problem:** Crashes are discovered by users, not proactively. No visibility into production errors.

**What to build:**
- Add Sentry (`@sentry/nextjs`)
- `sentry.server.config.ts` + `sentry.client.config.ts`
- Add `SENTRY_DSN` to environment variables
- Instrument the agent webhook route (most critical path)

**Files:** New config files, `next.config.js` (Sentry plugin), `.env`

---

## 3. Onboarding Flow

**Problem:** A new user who registers lands at a blank overview page with no machines, no alerts, no dashboards. No guidance on what to do next.

**What to build:**
- After org creation (`/setup-organization`), redirect to a simple onboarding page (`/onboarding`)
- Step 1: Copy the agent install command (pull from settings)
- Step 2: Wait for first heartbeat (poll `/api/machines` until 1+ machine appears)
- Step 3: "You're connected! Create your first alert" → CTA to `/alerts/create`
- Skip button at any step

**Files:** `src/app/onboarding/page.tsx` (new), `src/app/setup-organization/page.tsx` (update redirect)

---

## 4. Terms of Service + Privacy Policy

**Problem:** Required for any product that charges money. Without these, payment processors can reject the account.

**What to build:**
- `/terms` page — basic SaaS terms (can use a template, customize for Noblinks)
- `/privacy` page — GDPR-compliant privacy policy covering metric data, account data, retention
- Footer links to both pages
- Checkbox on register page: "I agree to the Terms of Service and Privacy Policy"

**Files:**
- `src/app/(site)/terms/page.tsx`
- `src/app/(site)/privacy/page.tsx`
- `src/components/site-footer.tsx` — add footer links
- `src/app/(auth)/register/page.tsx` — add agreement checkbox

---

## 5. Email Verification Before Payment

**Problem:** Users should verify their email before being allowed to subscribe. Prevents throwaway accounts from abusing trials.

**What to build:**
- In `CheckoutButton`: before calling `/api/auth/checkout`, check `session.user.emailVerified`
- If not verified → show toast "Please verify your email before subscribing" with a "Resend email" action
- `authClient.sendVerificationEmail()` already exists in auth-client

**Files:** `src/components/product/checkout-button.tsx`

---

## 6. Upgrade CTA When Approaching Limits

**Problem:** Users hit a hard 403 with no warning. Better UX is to show a soft warning before they hit the limit.

**What to build:**
- In each list page (machines, alerts, dashboards), after fetching the list:
  - If count ≥ 80% of plan limit → show a yellow banner: "You're using X/Y machines. Upgrade for more."
  - Link banner to `/pricing`
- Read plan from `useActiveOrganization()` metadata

**Files:**
- `src/app/(product)/machines/page.tsx`
- `src/app/(product)/alerts/page.tsx`
- `src/app/(product)/dashboards/page.tsx`

---

## Priority Order
1. Email verification check in checkout (1 hour)
2. ToS + Privacy pages (2 hours)
3. Onboarding flow (half day)
4. Upgrade CTAs (2 hours)
5. Rate limiting (half day)
6. Error monitoring / Sentry (1 hour)
