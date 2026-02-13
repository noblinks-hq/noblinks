import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization } from "better-auth/plugins"
import { createAccessControl } from "better-auth/plugins/access"
import { db } from "./db"

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