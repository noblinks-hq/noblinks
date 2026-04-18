import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Auth is shared — Lens uses the main Noblinks auth (src/lib/auth.ts → Neon DB).
// userId and organizationId reference the shared auth DB's user/organization tables.
// FK not enforced at DB level (different databases) — enforced in application code.

export const lensIamSetup = pgTable(
  "lens_iam_setup",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    externalId: text("external_id").notNull().unique(),
    roleArn: text("role_arn"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (t) => [index("lens_iam_user_id_idx").on(t.userId)]
);

export const lensAnalysis = pgTable(
  "lens_analysis",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    organizationId: text("organization_id").notNull(),
    // "hetzner" | "ovhcloud" | "aws_eu_sovereign" | "google_sovereign" | "azure_sovereign" | "scaleway"
    targetCloud: text("target_cloud").notNull(),
    // "iam_role" | "terraform" | "kubernetes" | "helm" | "cli_export" | "manual"
    inputMethod: text("input_method").notNull(),
    // "pending" | "running" | "complete" | "failed"
    status: text("status").notNull().default("pending"),
    canonicalModel: jsonb("canonical_model"),
    matchResults: jsonb("match_results"),
    ruleViolations: jsonb("rule_violations"),
    scoringResult: jsonb("scoring_result"),
    complianceFlags: jsonb("compliance_flags"),
    report: jsonb("report"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("lens_analysis_user_id_idx").on(t.userId),
    index("lens_analysis_org_id_idx").on(t.organizationId),
    index("lens_analysis_status_idx").on(t.status),
  ]
);
