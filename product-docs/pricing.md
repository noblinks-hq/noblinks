# Pricing

## Plans

| | Free | Pro | Team |
|---|---|---|---|
| **Price (monthly)** | $0 | $29/mo | $89/mo |
| **Price (annual)** | $0 | $23/mo ($276/yr) | $71/mo ($852/yr) |
| **Machines** | 3 | 20 | Unlimited |
| **Active alerts** | 5 | Unlimited | Unlimited |
| **Dashboards** | 3 | Unlimited | Unlimited |
| **Metric retention** | 24 hours | 30 days | 90 days |
| **Email notifications** | Yes | Yes | Yes |
| **Slack notifications** | No | Yes | Yes |
| **Webhook notifications** | No | No | Yes |
| **Dashboard sharing** | No | Yes | Yes |
| **AI incident assistant** | No | Yes | Yes |
| **Team members** | No | Up to 5 | Unlimited |

---

## How Limits Are Enforced

Limits are enforced server-side at the API layer. When a limit is reached, the relevant `POST` endpoint returns:

```json
{ "error": "limit_reached", "resource": "machines", "plan": "free", "limit": 3 }
```
with HTTP status `403`.

| Resource | Enforced at |
|---|---|
| Machines | `POST /api/machines` |
| Alerts | `POST /api/alerts` |
| Dashboards | `POST /api/dashboards` |

The plan is read from the org's `metadata` field (`metadata.plan`). If no plan is set, `free` is assumed.

---

## Checkout Flow

1. User visits `/pricing`
2. Clicks **Get started** on Pro or Team
3. If not logged in → redirected to `/login?redirect=/pricing`
4. If logged in → `POST /api/auth/checkout` is called with the plan `slug` and the org ID as `referenceId`
5. Polar returns a checkout URL → user is redirected to Polar's hosted checkout page
6. On success → user lands on `/pricing/success`

**Polar product IDs (sandbox):**

| Plan | Product ID |
|---|---|
| Pro (monthly) | `57ebfc19-4a1b-4259-a116-d8a0833b7da3` |
| Team (monthly) | `51543af2-05cb-4321-874e-c6ae4bcf38b0` |
| Pro (annual) | TBD — create in Polar dashboard |
| Team (annual) | TBD — create in Polar dashboard |

Webhook endpoint: `<domain>/api/auth/polar/webhooks`

---

## How Plan State Is Stored

The active plan is stored as JSON in the `organization.metadata` column:

```json
{ "plan": "pro" }
```

Valid values: `free`, `pro`, `team`.

This is updated automatically by Polar webhook events:

- `subscription.active` → sets `plan` to the subscribed tier
- `subscription.canceled` → resets `plan` to `free`

The org's `referenceId` (passed during checkout) ties a Polar subscription back to the correct org.

---

## Customer Portal

Existing subscribers can manage their subscription (cancel, update payment method, view invoices) via the Polar customer portal.

- Accessible from **Settings** → **Manage Billing** button
- Calls `POST /api/auth/customer/portal` → redirects to Polar's hosted portal

---

## Environment Variables

| Variable | Description |
|---|---|
| `POLAR_ACCESS_TOKEN` | Access token from sandbox.polar.sh or polar.sh |
| `POLAR_WEBHOOK_SECRET` | Webhook signing secret from Polar dashboard |
| `POLAR_SERVER` | `sandbox` (default) or `production` |

**Source of truth:** `src/lib/plan.ts` for limits and product ID mapping, `src/lib/auth.ts` for Polar plugin config.
