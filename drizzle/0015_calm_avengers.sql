CREATE TABLE IF NOT EXISTS "lens_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"target_cloud" text NOT NULL,
	"input_method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"canonical_model" jsonb,
	"match_results" jsonb,
	"rule_violations" jsonb,
	"scoring_result" jsonb,
	"compliance_flags" jsonb,
	"report" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lens_iam_setup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"external_id" text NOT NULL,
	"role_arn" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "lens_iam_setup_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lens_analysis_user_id_idx" ON "lens_analysis" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lens_analysis_org_id_idx" ON "lens_analysis" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lens_analysis_status_idx" ON "lens_analysis" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lens_iam_user_id_idx" ON "lens_iam_setup" USING btree ("user_id");
