ALTER TABLE "contract" ADD COLUMN "created_by" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contract" ADD CONSTRAINT "contract_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
