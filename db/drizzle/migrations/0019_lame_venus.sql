CREATE TABLE IF NOT EXISTS "album_contract_breakdown" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text,
	"albumId" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "song_contract_breakdown" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text,
	"songId" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "contract_breakdown_association";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "album_contract_breakdown" ADD CONSTRAINT "album_contract_breakdown_contract_id_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "album_contract_breakdown" ADD CONSTRAINT "album_contract_breakdown_albumId_spotifyAlbum_id_fk" FOREIGN KEY ("albumId") REFERENCES "spotifyAlbum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "song_contract_breakdown" ADD CONSTRAINT "song_contract_breakdown_contract_id_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "song_contract_breakdown" ADD CONSTRAINT "song_contract_breakdown_songId_spotifyTrack_id_fk" FOREIGN KEY ("songId") REFERENCES "spotifyTrack"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
