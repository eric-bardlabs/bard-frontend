ALTER TABLE "contract_details" DROP CONSTRAINT "contract_details_contract_id_unique";--> statement-breakpoint
ALTER TABLE "contract_details" ADD COLUMN "song_id" text;--> statement-breakpoint
ALTER TABLE "contract_details" ADD COLUMN "album_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_song_id_spotifyTrack_id_fk" FOREIGN KEY ("song_id") REFERENCES "spotifyTrack"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_album_id_spotifyAlbum_id_fk" FOREIGN KEY ("album_id") REFERENCES "spotifyAlbum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_album_id_song_id_contract_id_unique" UNIQUE("album_id","song_id","contract_id");