ALTER TABLE "album_contract_breakdown" DROP CONSTRAINT "album_contract_breakdown_contract_id_contract_id_fk";
--> statement-breakpoint
ALTER TABLE "song_contract_breakdown" DROP CONSTRAINT "song_contract_breakdown_contract_id_contract_id_fk";
--> statement-breakpoint
ALTER TABLE "album_contract_breakdown" ADD COLUMN "contract_breakdown_id" text;--> statement-breakpoint
ALTER TABLE "song_contract_breakdown" ADD COLUMN "contract_breakdown_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "album_contract_breakdown" ADD CONSTRAINT "album_contract_breakdown_contract_breakdown_id_contract_breakdown_id_fk" FOREIGN KEY ("contract_breakdown_id") REFERENCES "contract_breakdown"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "song_contract_breakdown" ADD CONSTRAINT "song_contract_breakdown_contract_breakdown_id_contract_breakdown_id_fk" FOREIGN KEY ("contract_breakdown_id") REFERENCES "contract_breakdown"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "album_contract_breakdown" DROP COLUMN IF EXISTS "contract_id";--> statement-breakpoint
ALTER TABLE "song_contract_breakdown" DROP COLUMN IF EXISTS "contract_id";