# Polar Payments — Implementation Plan

## Summary

Integrate Polar as the payment provider for Noblinks using the BetterAuth Polar plugin. Users can subscribe to Pro ($29/mo) and Team ($89/mo) plans via Polar checkout sessions, manage their subscription via the Polar customer portal, and the app receives webhook events on subscription lifecycle changes.

---

## Phase 1: Infrastructure ✅

Wire up the Polar SDK and BetterAuth plugin so the auth layer knows about Polar.

### Tasks
- [x] Install `@polar-sh/better-auth` and `@polar-sh/sdk`
- [x] Add `POLAR_ACCESS_TOKEN` and `POLAR_WEBHOOK_SECRET` to `src/lib/env.ts` with warning if missing
- [x] Add Polar product IDs to `src/lib/auth.ts` (`polar()` plugin with `checkout`, `portal`, `webhooks`)
  - Pro: `57ebfc19-4a1b-4259-a116-d8a0833b7da3`
  - Team: `51543af2-05cb-4321-874e-c6ae4bcf38b0`
- [x] Add `polarClient()` to `src/lib/auth-client.ts`; export `checkout` and `customer`

### Environment Variables
```
POLAR_ACCESS_TOKEN=<Polar sandbox access token>
POLAR_WEBHOOK_SECRET=<Polar webhook secret>
```

### Webhook endpoint (configure in Polar dashboard)
```
<your-domain>/api/auth/polar/webhooks
```

---

## Phase 2: Checkout Flow ✅

Let users on the pricing page start a Polar checkout session.

### Tasks
- [x] Create `src/components/product/checkout-button.tsx` — client component that:
  - Redirects unauthenticated users to `/login?redirect=/pricing`
  - Calls `authClient.checkout({ slug, referenceId: orgId })` for authenticated users
- [x] Update `src/app/(site)/pricing/page.tsx` — replace Pro/Team `<Link href="/register">` CTAs with `<CheckoutButton>`
- [x] Create `src/app/(site)/pricing/success/page.tsx` — post-checkout confirmation page with link to dashboard

### Flow
```
/pricing → click "Get started" (Pro/Team)
  └─ not logged in → /login?redirect=/pricing
  └─ logged in → Polar sandbox checkout
       └─ complete → /pricing/success?checkout_id={CHECKOUT_ID}
```

---

## Phase 3: Customer Portal ✅

Let existing subscribers manage their subscription from the settings page.

### Tasks
- [x] Create `src/components/product/billing-button.tsx` — calls `authClient.customer.portal()`
- [x] Replace disabled "Upgrade Plan" button in `src/app/(product)/settings/page.tsx` with `<BillingButton>`

---

## Phase 4: Plan Enforcement (TODO)

Limit product features based on the active subscription tier. This phase is intentionally deferred until checkout and portal are validated in production.

### Planned Tasks
- [ ] On webhook `onSubscriptionActive`: store plan slug (`pro` / `team`) on org metadata
- [ ] On webhook `onSubscriptionCanceled`: revert org metadata plan to `free`
- [ ] Create a `getPlan(orgId)` server utility that reads org metadata
- [ ] Enforce limits in API routes:
  - `POST /api/machines` — cap at 3 (free), 20 (pro), unlimited (team)
  - `POST /api/alerts` — cap at 5 active (free), unlimited (pro/team)
  - `POST /api/dashboards` — cap at 3 (free), unlimited (pro/team)
- [ ] Show upgrade prompt in UI when limit is hit (e.g. "You've reached the Free plan limit")
- [ ] Display current plan badge accurately in settings (currently reads from org metadata `plan` field)

---

## Phase 5: Annual Billing & Promotions (TODO)

- [ ] Add annual billing products to Polar dashboard (20% discount)
- [ ] Add billing period toggle (monthly / annual) to pricing page
- [ ] Pass correct product slug to `CheckoutButton` based on toggle state

---

## Notes

- `server: "sandbox"` in `src/lib/auth.ts` — flip to `"production"` when going live
- The `referenceId` passed to checkout is the active org ID, enabling org-level subscription tracking
- Polar customer is created automatically on sign-up via `createCustomerOnSignUp: true`
- Webhook events are logged to the server console until Phase 4 persists them to the database
