import { db } from "@/db/dbClient";
import {
  spotifyAlbum,
  spotifyArtist,
  spotifyTrack,
} from "@/db/schema";
import axios from "axios";
import querystring from "querystring";
import SpotifyWebApi from "spotify-web-api-node";
// credentials are optional
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: "https://app.bardlabs.co",
});

export const getAccessToken = async () => {
  const data = {
    grant_type: "client_credentials",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  };
  const token = await axios.post(
    "https://accounts.spotify.com/api/token",
    querystring.stringify(data),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return token.data;
};

export const getSpotifyTrack = async (trackId: string) => {
  const token = await getAccessToken();
  spotifyApi.setAccessToken(token.access_token);
  const track = await spotifyApi.getTrack(trackId, {});
  return track.body;
};

export const getSpotifyAlbum = async (albumId: string) => {
  const token = await getAccessToken();
  spotifyApi.setAccessToken(token.access_token);
  const singleAlbumData = await spotifyApi.getAlbum(albumId);
  return singleAlbumData.body;
};

export const getSpotifyPlaylist = async (playlistId: string) => {
  const token = await getAccessToken();
  spotifyApi.setAccessToken(token.access_token);
  const playlistData = await spotifyApi.getPlaylist(playlistId);
  return playlistData.body;
};

export const getSpotifyAlbumsOfArtist = async (
  artistId: string,
  option: {
    limit?: number;
    offset?: number;
  }
) => {
  const token = await getAccessToken();
  spotifyApi.setAccessToken(token.access_token);
  const albumsData = await spotifyApi.getArtistAlbums(artistId, {
    limit: option.limit || 50,
    offset: option.offset || 0,
    include_groups: "album,single",
  });
  return albumsData.body;
};

const pullSpotifyAlbumsAndTracks = async (
  artistId: string,
  organizationId: string
) => {
  const token = await getAccessToken();
  spotifyApi.setAccessToken(token.access_token);

  const artistData = await spotifyApi.getArtist(artistId);

  await db
    .insert(spotifyArtist)
    .values({
      id: artistId,
      name: artistData.body.name,
    })
    .onConflictDoNothing();

  const data = await spotifyApi.getArtistAlbums(artistId, {
    limit: 50,
    offset: 0,
  });

  const fullData = await Promise.all(
    data.body.items.map(async (item) => {
      const tracks = await spotifyApi.getAlbumTracks(item.id, {
        limit: 50,
      });

      // TODO maybe this leads to rate limits, just use tracks if needed
      // const fullAlbum = await spotifyApi.getAlbum(item.id);
      // const tracksWithExternalIds = await spotifyApi.getTracks(
      //   tracks.body.items.map((track) => track.id)
      // );
      return { ...item, tracks: tracks.body.items };
    })
  );

  await Promise.all(
    fullData.map(async (singleAlbum) => {
      const { id, name, images, tracks } = singleAlbum;
      if (
        singleAlbum.album_type !== "album" &&
        singleAlbum.album_type !== "single"
      ) {
        return;
      }
      await db
        .insert(spotifyAlbum)
        .values({
          id: singleAlbum.id,
          albumArtUrl: images[0]?.url ?? "",
          organizationId,
          title: singleAlbum.name,
          totalTracks: singleAlbum.total_tracks,
          releaseDate: singleAlbum.release_date,
        })
        .onConflictDoNothing();

      for (const t of tracks) {
        const trackId = t.id;
        const track = await spotifyApi.getTrack(trackId, {});

        await db
          .insert(spotifyTrack)
          .values({
            id: track.body.id,
            displayName: track.body.name,
            durationMs: track.body.duration_ms.toString(),
            isrc: track.body.external_ids.isrc,
            upc: track.body.external_ids.upc,
            ean: track.body.external_ids.ean,
            albumId: id,
            organizationId: organizationId,
          })
          .onConflictDoNothing();
      }
      // await db
      //   .insert(spotifyTrack)
      //   .values(
      //     tracks.map((track) => {
      //       return {
      //         id: track.id,
      //         displayName: track.name,
      //         albumId: id,
      //         durationMs: track.duration_ms.toString(),
      //         organizationId,
      //       };
      //     })
      //   )
      //   .onConflictDoNothing();

      await Promise.all(
        tracks.map(async (track) => {
          const artists = track.artists;
          await Promise.all(
            artists.map(async (artist) => {
              await db
                .insert(spotifyArtist)
                .values({
                  id: artist.id,
                  name: artist.name,
                })
                .onConflictDoNothing();
            })
          );
        })
      );
    })
  );
};

export default spotifyApi;

export { pullSpotifyAlbumsAndTracks };
