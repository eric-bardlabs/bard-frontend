import { 
  getSpotifyAlbum, 
  getSpotifyPlaylist, 
  getSpotifyTrack,
  getSpotifyAlbumsOfArtist 
} from "@/api_clients/spotify/SpotifyAPIClient";
import { db } from "@/db/dbClient";
import {
  collaboratorProfile,
  organizationCollaboratorProfile,
  songCollaborator,
  spotifyAlbum,
  spotifyTrack,
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { typeid } from "typeid-js";

// Helper function to save album
const saveAlbum = async (
  album: SpotifyApi.AlbumObjectSimplified | SpotifyApi.AlbumObjectFull,
  organizationId: string
) => {
  let albumId;
  const existedAlbum = await db.query.spotifyAlbum.findFirst({
    where: and(
      eq(spotifyAlbum.spotifyAlbumId, album.id),
      eq(spotifyAlbum.organizationId, organizationId)
    ),
  });

  albumId = existedAlbum?.id;

  if (!existedAlbum) {
    const insertedAlbum = await db
      .insert(spotifyAlbum)
      .values({
        id: typeid("alb").toString(),
        spotifyAlbumId: album.id,
        title: album.name,
        albumArtUrl: album.images[0]?.url,
        releaseDate: album.release_date,
        organizationId: organizationId,
      })
      .returning();
    albumId = insertedAlbum[0].id;
  }

  return albumId;
};

// Helper function to save artist/collaborator
const saveArtist = async (
  artist: SpotifyApi.ArtistObjectSimplified | SpotifyApi.ArtistObjectFull,
  organizationId: string
) => {
  let artistId;
  const existedArtist = await db.query.collaboratorProfile.findFirst({
    where: and(
      eq(collaboratorProfile.spotifyArtistId, artist.id),
      eq(collaboratorProfile.organizationId, organizationId)
    ),
  });

  artistId = existedArtist?.id;

  if (!existedArtist) {
    const insertedArtist = await db
      .insert(collaboratorProfile)
      .values({
        id: typeid("collabprofile").toString(),
        artistName: artist.name,
        legalName: artist.name,
        organizationId: organizationId,
        spotifyArtistId: artist.id,
        initialSource: "spotify",
      })
      .returning();
    artistId = insertedArtist[0].id;

    // Link artist to organization
    const orgCollaborator =
      await db.query.organizationCollaboratorProfile.findFirst({
        where: and(
          eq(organizationCollaboratorProfile.organizationId, organizationId),
          eq(
            organizationCollaboratorProfile.collaboratorProfileId,
            artistId
          )
        ),
      });

    if (!orgCollaborator) {
      await db.insert(organizationCollaboratorProfile).values({
        id: typeid("orgcollabprofile").toString(),
        organizationId,
        collaboratorProfileId: artistId,
      });
    }
  }

  return artistId;
};

// Helper function to save track
const saveTrack = async (
  track: SpotifyApi.TrackObjectFull,
  organizationId: string,
  albumId?: string
) => {
  // Check if track already exists
  const existedTrack = await db.query.spotifyTrack.findFirst({
    where: and(
      eq(spotifyTrack.spotifyTrackId, track.id),
      eq(spotifyTrack.organizationId, organizationId)
    ),
  });

  if (existedTrack) {
    return { 
      trackId: existedTrack.id, 
      trackInfo: {
        name: existedTrack.displayName,
        artistName: track.artists[0]?.name || "",
        albumName: track.album?.name || "",
      },
      isNew: false 
    };
  }

  // Save artists
  const artistIds = await Promise.all(
    track.artists.map((artist) => saveArtist(artist, organizationId))
  );

  // Insert track
  const insertedTrack = await db
    .insert(spotifyTrack)
    .values({
      id: typeid("song").toString(),
      spotifyTrackId: track.id,
      displayName: track.name,
      durationMs: track.duration_ms?.toString(),
      isrc: track.external_ids?.isrc,
      upc: track.external_ids?.upc,
      ean: track.external_ids?.ean,
      status: "Release", // Default to released from spotify
      albumId: albumId,
      organizationId: organizationId,
      initialSource: "spotify",
    })
    .returning({ id: spotifyTrack.id });

  const trackId = insertedTrack[0].id;

  // Link all artists as collaborators
  await Promise.all(
    artistIds.map(async (artistId) => {
      const songCol = await db.query.songCollaborator.findFirst({
        where: and(
          eq(songCollaborator.songId, trackId),
          eq(songCollaborator.collaboratorProfileId, artistId)
        ),
      });

      if (!songCol) {
        await db.insert(songCollaborator).values({
          id: typeid("songcollab").toString(),
          songId: trackId,
          collaboratorProfileId: artistId,
          role: "writer",
        });
      }
    })
  );

  return { 
    trackId, 
    trackInfo: {
      name: track.name,
      collaborators: track.artists.map((artist) => artist.name),
      artistName: track.artists[0]?.name || "",
      albumName: track.album?.name || "",
    },
    isNew: true 
  };
};

// POST handler
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, spotifyId, organizationId } = body;

    if (!type || !spotifyId || !organizationId) {
      return NextResponse.json(
        { 
          error: "Missing required parameters",
          detail: "Please provide type, spotifyId, and organizationId" 
        },
        { status: 400 }
      );
    }

    let result;
    let importedCount = 0;
    const importedTracks: any[] = [];

    switch (type) {
      case "track": {
        const trackData = await getSpotifyTrack(spotifyId);
        
        // Save album if it exists
        let albumId = undefined;
        if (trackData.album) {
          albumId = await saveAlbum(trackData.album, organizationId);
        }
        
        // Save track
        const { isNew, trackInfo } = await saveTrack(trackData, organizationId, albumId);
        importedCount = isNew ? 1 : 0;
        if (isNew) {
          importedTracks.push(trackInfo);
        }
        
        result = {
          success: true,
          type: "track",
          imported: importedCount,
          tracks: importedTracks,
          message: isNew 
            ? `Successfully imported "${trackData.name}"`
            : `"${trackData.name}" already exists in your catalog`,
        };
        break;
      }

      case "album": {
        const albumData = await getSpotifyAlbum(spotifyId);
        
        // Save album
        const albumId = await saveAlbum(albumData, organizationId);
        
        // Get all tracks from the album
        const tracks = albumData.tracks.items;
        let newTracks = 0;
        
        // Import each track
        for (const track of tracks) {
          // Get full track data
          const fullTrack = await getSpotifyTrack(track.id);
          const { isNew, trackInfo } = await saveTrack(
            fullTrack,
            organizationId,
            albumId
          );
          if (isNew) {
            newTracks++;
            importedTracks.push(trackInfo);
          }
        }
        
        importedCount = newTracks;
        result = {
          success: true,
          type: "album",
          imported: importedCount,
          total: tracks.length,
          tracks: importedTracks,
          message: `Imported ${newTracks} new tracks from "${albumData.name}"`,
        };
        break;
      }

      case "playlist": {
        const playlistData = await getSpotifyPlaylist(spotifyId);
        
        let newTracks = 0;
        const tracks = playlistData.tracks.items
          .filter((item) => item.track && item.track.type === "track")
          .map((item) => item.track as SpotifyApi.TrackObjectFull);
        
        // Import each track
        for (const track of tracks) {
          // Save album if it exists
          let albumId = undefined;
          if (track.album) {
            albumId = await saveAlbum(track.album, organizationId);
          }
          
          const { isNew, trackInfo } = await saveTrack(track, organizationId, albumId);
          if (isNew) {
            newTracks++;
            importedTracks.push(trackInfo);
          }
        }
        
        importedCount = newTracks;
        result = {
          success: true,
          type: "playlist",
          imported: importedCount,
          total: tracks.length,
          tracks: importedTracks,
          message: `Imported ${newTracks} new tracks from "${playlistData.name}"`,
        };
        break;
      }

      case "artist": {
        // First save the artist
        const artistId = await saveArtist(
          { id: spotifyId, name: "" } as SpotifyApi.ArtistObjectSimplified,
          organizationId
        );

        let newTracks = 0;
        let totalTracks = 0;
        let offset = 0;
        const limit = 50;
        
        // Fetch all albums of the artist (including singles)
        do {
          const albumsData = await getSpotifyAlbumsOfArtist(spotifyId, {
            limit,
            offset,
          });
          
          // Process each album
          for (const album of albumsData.items) {
            // Get full album data to get all tracks
            const fullAlbumData = await getSpotifyAlbum(album.id);
            
            // Save the album
            const albumId = await saveAlbum(fullAlbumData, organizationId);
            
            // Import each track from the album
            for (const track of fullAlbumData.tracks.items) {
              // Get full track data
              const fullTrack = await getSpotifyTrack(track.id);
              const { isNew, trackInfo } = await saveTrack(
                fullTrack,
                organizationId,
                albumId
              );
              if (isNew) {
                newTracks++;
                importedTracks.push(trackInfo);
              }
              totalTracks++;
            }
          }
          
          // Check if there are more albums to fetch
          if (albumsData.next) {
            offset += limit;
          } else {
            break;
          }
        } while (true);
        
        importedCount = newTracks;
        result = {
          success: true,
          type: "artist",
          imported: importedCount,
          total: totalTracks,
          tracks: importedTracks,
          message: `Imported ${newTracks} new tracks from artist's discography`,
        };
        break;
      }

      default:
        return NextResponse.json(
          { 
            error: "Invalid type",
            detail: "Type must be 'track', 'album', 'playlist', or 'artist'" 
          },
          { status: 400 }
        );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error importing from Spotify:", error);
    
    // Handle specific Spotify API errors
    if (error.statusCode === 404) {
      return NextResponse.json(
        { 
          error: "Not found",
          detail: `The ${error.type || 'item'} was not found on Spotify. Please check the URL and try again.`
        },
        { status: 404 }
      );
    }
    
    if (error.statusCode === 401) {
      return NextResponse.json(
        { 
          error: "Authentication error",
          detail: "Failed to authenticate with Spotify. Please try again later."
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Import failed",
        detail: error.message || "An unexpected error occurred while importing from Spotify"
      },
      { status: 500 }
    );
  }
}