CREATE TABLE "metric_sample" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"machine_name" text NOT NULL,
	"metric_key" text NOT NULL,
	"value" real NOT NULL,
	"sampled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "metric_sample" ADD CONSTRAINT "metric_sample_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "metric_sample_lookup_idx" ON "metric_sample" USING btree ("organization_id","machine_name","metric_key","sampled_at");