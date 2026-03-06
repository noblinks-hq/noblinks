import { polarClient } from "@polar-sh/better-auth"
import { organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [organizationClient(), polarClient()],
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