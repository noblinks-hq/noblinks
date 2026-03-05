CREATE TABLE "widget" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"metric" text NOT NULL,
	"machine" text NOT NULL,
	"capability_key" text,
	"threshold_value" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "widget" ADD CONSTRAINT "widget_dashboard_id_dashboard_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget" ADD CONSTRAINT "widget_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "widget_dashboard_id_idx" ON "widget" USING btree ("dashboard_id");--> statement-breakpoint
CREATE INDEX "widget_org_id_idx" ON "widget" USING btree ("organization_id");