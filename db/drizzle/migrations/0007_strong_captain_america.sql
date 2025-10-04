DO $$ BEGIN
 ALTER TABLE "organization" ADD CONSTRAINT "organization_spotify_artist_id_spotifyArtist_id_fk" FOREIGN KEY ("spotify_artist_id") REFERENCES "spotifyArtist"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
