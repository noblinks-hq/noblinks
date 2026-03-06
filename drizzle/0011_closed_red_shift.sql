ALTER TABLE "alert" ADD COLUMN "notify_on_fire" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "alert" ADD COLUMN "notify_on_resolve" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "alert" ADD COLUMN "fired_at" timestamp;--> statement-breakpoint
ALTER TABLE "alert" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "notification_email" text;