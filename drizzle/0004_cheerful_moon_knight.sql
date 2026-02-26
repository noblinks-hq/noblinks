CREATE TABLE "alert" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capability_id" uuid NOT NULL,
	"machine" text NOT NULL,
	"threshold" integer NOT NULL,
	"window" text NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"promql_query" text NOT NULL,
	"status" text DEFAULT 'configured' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_capability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"capability_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"metric" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"alert_template" text NOT NULL,
	"default_threshold" integer DEFAULT 80 NOT NULL,
	"default_window" text DEFAULT '5m' NOT NULL,
	"suggested_severity" text DEFAULT 'warning' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monitoring_capability_capability_key_unique" UNIQUE("capability_key")
);
--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_capability_id_monitoring_capability_id_fk" FOREIGN KEY ("capability_id") REFERENCES "public"."monitoring_capability"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_org_id_idx" ON "alert" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "alert_capability_id_idx" ON "alert" USING btree ("capability_id");--> statement-breakpoint
CREATE INDEX "alert_created_by_idx" ON "alert" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "alert_status_idx" ON "alert" USING btree ("status");--> statement-breakpoint
CREATE INDEX "capability_key_idx" ON "monitoring_capability" USING btree ("capability_key");--> statement-breakpoint
CREATE INDEX "capability_category_idx" ON "monitoring_capability" USING btree ("category");