CREATE TABLE IF NOT EXISTS "collaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"legal_name" text,
	"artist_name" text,
	"email" text,
	"roles" text,
	"organization_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "collaboratorRole" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"collaborator_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collaborator" ADD CONSTRAINT "collaborator_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collaboratorRole" ADD CONSTRAINT "collaboratorRole_collaborator_id_collaborator_id_fk" FOREIGN KEY ("collaborator_id") REFERENCES "collaborator"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
