CREATE TABLE IF NOT EXISTS "contract_details" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text,
	"detail_json" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_contract_id_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
