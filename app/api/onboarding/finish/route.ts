import { db } from "@/db/dbClient";
import {
  collaboratorProfile,
  organizationCollaboratorProfile,
  songCollaborator,
  spotifyAlbum,
  spotifyTrack,
  user,
} from "@/db/schema";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { typeid } from "typeid-js";

// Helper function to sanitize date strings for PostgreSQL
function sanitizeDateString(dateString: string): string | null {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  // Try to parse the date string
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return null;
  }

  // Return ISO string format which PostgreSQL can handle
  return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
}

type InitialData = {
  identity: {
    legalName: string;
    artistName: string;
    organization: string;
    pro: string;
    proId: string;
    allowSms: boolean;
    phoneNumber: string;
  };
  artists: {
    id: string;
    legalName: string;
    artistName: string;
    email: string;
    pro: string;
    proId: string;
  }[];
  tracks: {
    id: string;
    name: string;
    artist: string;
    artistId: string;
    albumId: string;
    status: string;
    isrc: string;
    upc: string;
    ean: string;
    releaseDate: string;
    spotifyLink: string;
    spotifyTrackId: string;
    pitch: string;
    collaborators: {
      id: string;
      songwriting_split: string;
      publishing_split: string;
      master_split: string;
    }[];
  }[];
  albums: {
    id: string;
    name: string;
    artUrl: string;
    releaseDate: string;
  }[];
  calendar: string;
  uploadedFiles?: string[];
};

export async function POST() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const firstUser = await db.query.user.findFirst({
    where: eq(user.id, clerkUser.id),
  });

  if (!firstUser) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  // Clear user onboarding state, set allow SMS notifications
  await db
    .update(user)
    .set({
      initialStep: null,
    })
    .where(eq(user.id, firstUser.id));

  return NextResponse.json(
    {
      success: true,
    },
    { status: 200 }
  );
}
