CREATE TABLE IF NOT EXISTS "spotifyTrackCollaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"track_id" text,
	"artist_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotifyTrackCollaborator" ADD CONSTRAINT "spotifyTrackCollaborator_track_id_spotifyTrack_id_fk" FOREIGN KEY ("track_id") REFERENCES "spotifyTrack"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotifyTrackCollaborator" ADD CONSTRAINT "spotifyTrackCollaborator_artist_id_spotifyArtist_id_fk" FOREIGN KEY ("artist_id") REFERENCES "spotifyArtist"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
