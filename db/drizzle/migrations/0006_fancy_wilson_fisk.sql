ALTER TABLE "spotifyAlbum" DROP CONSTRAINT "spotifyAlbum_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "spotifyAlbumCollaborator" DROP CONSTRAINT "spotifyAlbumCollaborator_album_id_spotifyAlbum_id_fk";
--> statement-breakpoint
ALTER TABLE "spotifyTrack" DROP CONSTRAINT "spotifyTrack_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "spotifyAlbumCollaborator" ADD COLUMN "artist_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotifyAlbum" ADD CONSTRAINT "spotifyAlbum_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotifyAlbumCollaborator" ADD CONSTRAINT "spotifyAlbumCollaborator_artist_id_spotifyArtist_id_fk" FOREIGN KEY ("artist_id") REFERENCES "spotifyArtist"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotifyAlbumCollaborator" ADD CONSTRAINT "spotifyAlbumCollaborator_album_id_spotifyAlbum_id_fk" FOREIGN KEY ("album_id") REFERENCES "spotifyAlbum"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotifyTrack" ADD CONSTRAINT "spotifyTrack_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "spotifyAlbumCollaborator" DROP COLUMN IF EXISTS "display_name";