CREATE TABLE IF NOT EXISTS "contract_breakdown" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text,
	"detail_json" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contract_breakdown_association" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text,
	"song_or_album_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contract_breakdown" ADD CONSTRAINT "contract_breakdown_contract_id_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contract_breakdown_association" ADD CONSTRAINT "contract_breakdown_association_contract_id_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contract_breakdown_association" ADD CONSTRAINT "contract_breakdown_association_song_or_album_id_spotifyTrack_id_fk" FOREIGN KEY ("song_or_album_id") REFERENCES "spotifyTrack"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
