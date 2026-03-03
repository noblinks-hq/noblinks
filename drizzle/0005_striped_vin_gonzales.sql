CREATE TABLE "machine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"hostname" text,
	"ip" text,
	"agent_version" text,
	"category" text,
	"status" text DEFAULT 'online' NOT NULL,
	"last_seen" timestamp,
	"agent_token_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "machine_agent_token_hash_unique" UNIQUE("agent_token_hash")
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "agent_registration_token" text;--> statement-breakpoint
ALTER TABLE "machine" ADD CONSTRAINT "machine_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "machine_org_id_idx" ON "machine" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "machine_agent_token_hash_idx" ON "machine" USING btree ("agent_token_hash");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_agent_registration_token_unique" UNIQUE("agent_registration_token");