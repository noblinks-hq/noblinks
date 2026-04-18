ALTER TABLE "agent_query" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "alert" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "alert_event" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dashboard" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "environment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "machine" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "metric_sample" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "monitoring_capability" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification_channel" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "widget" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "agent_query" CASCADE;--> statement-breakpoint
DROP TABLE "alert" CASCADE;--> statement-breakpoint
DROP TABLE "alert_event" CASCADE;--> statement-breakpoint
DROP TABLE "dashboard" CASCADE;--> statement-breakpoint
DROP TABLE "environment" CASCADE;--> statement-breakpoint
DROP TABLE "machine" CASCADE;--> statement-breakpoint
DROP TABLE "metric_sample" CASCADE;--> statement-breakpoint
DROP TABLE "monitoring_capability" CASCADE;--> statement-breakpoint
DROP TABLE "notification_channel" CASCADE;--> statement-breakpoint
DROP TABLE "widget" CASCADE;--> statement-breakpoint
ALTER TABLE "organization" DROP CONSTRAINT "organization_agent_registration_token_unique";--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "agent_registration_token";--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "notification_email";