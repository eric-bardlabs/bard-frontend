CREATE TABLE IF NOT EXISTS "spotifyAlbum" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"release_date" text,
	"total_tracks" integer,
	"organization_id" text,
	"album_art_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spotifyAlbumCollaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"album_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spotifyArtist" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spotifyTrack" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"organization_id" text,
	"album_id" text,
	"duration_ms" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "spotify_artist_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotifyAlbum" ADD CONSTRAINT "spotifyAlbum_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotifyAlbumCollaborator" ADD CONSTRAINT "spotifyAlbumCollaborator_album_id_spotifyAlbum_id_fk" FOREIGN KEY ("album_id") REFERENCES "spotifyAlbum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotifyTrack" ADD CONSTRAINT "spotifyTrack_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotifyTrack" ADD CONSTRAINT "spotifyTrack_album_id_spotifyAlbum_id_fk" FOREIGN KEY ("album_id") REFERENCES "spotifyAlbum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
