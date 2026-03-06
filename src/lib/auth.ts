import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth"
import { Polar } from "@polar-sh/sdk"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization } from "better-auth/plugins"
import { createAccessControl } from "better-auth/plugins/access"
import { db } from "./db"
import { PRODUCT_PLAN_MAP, setOrgPlan } from "./plan"

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
})

const statement = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  machine: ["create", "update", "delete", "view"],
  dashboard: ["create", "update", "delete", "view"],
  alert: ["create", "update", "delete", "view", "acknowledge"],
} as const

const ac = createAccessControl(statement)

const ownerRole = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  machine: ["create", "update", "delete", "view"],
  dashboard: ["create", "update", "delete", "view"],
  alert: ["create", "update", "delete", "view", "acknowledge"],
})

const adminRole = ac.newRole({
  member: ["create", "update"],
  invitation: ["create"],
  machine: ["create", "update", "delete", "view"],
  dashboard: ["create", "update", "view"],
  alert: ["create", "update", "delete", "view", "acknowledge"],
})

const memberRole = ac.newRole({
  machine: ["view"],
  dashboard: ["view"],
  alert: ["view"],
})

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Log password reset URL to terminal (no email integration yet)
      // eslint-disable-next-line no-console
      console.log(`\n${"=".repeat(60)}\nPASSWORD RESET REQUEST\nUser: ${user.email}\nReset URL: ${url}\n${"=".repeat(60)}\n`)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Log verification URL to terminal (no email integration yet)
      // eslint-disable-next-line no-console
      console.log(`\n${"=".repeat(60)}\nEMAIL VERIFICATION\nUser: ${user.email}\nVerification URL: ${url}\n${"=".repeat(60)}\n`)
    },
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            { productId: "57ebfc19-4a1b-4259-a116-d8a0833b7da3", slug: "pro" },
            { productId: "51543af2-05cb-4321-874e-c6ae4bcf38b0", slug: "team" },
            // TODO: replace with real annual product IDs from Polar dashboard
            { productId: "REPLACE_WITH_POLAR_PRO_ANNUAL_PRODUCT_ID", slug: "pro-annual" },
            { productId: "REPLACE_WITH_POLAR_TEAM_ANNUAL_PRODUCT_ID", slug: "team-annual" },
          ],
          successUrl: "/pricing/success?checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET ?? "",
          onSubscriptionActive: async (payload) => {
            const productId = payload.data.productId
            const orgId = (payload.data.metadata as Record<string, string> | undefined)?.referenceId
            if (orgId) {
              const plan = PRODUCT_PLAN_MAP[productId] ?? "pro"
              await setOrgPlan(orgId, plan)
            }
          },
          onSubscriptionCanceled: async (payload) => {
            const orgId = (payload.data.metadata as Record<string, string> | undefined)?.referenceId
            if (orgId) {
              await setOrgPlan(orgId, "free")
            }
          },
        }),
      ],
    }),
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