import spotifyApi from "@/api_clients/spotify/SpotifyAPIClient";
import { db } from "@/db/dbClient";
import { spotifyArtist } from "@/db/schema";
import axios from "axios";
import { eq } from "drizzle-orm";
import { exit } from "process";
import querystring from "querystring";

const a = async () => {
  const getAccessToken = async () => {
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

  const token = await getAccessToken();
  spotifyApi.setAccessToken(token.access_token);

  const artists = await db.query.spotifyArtist.findMany({});

  for (const artist of artists) {
    if (artist.profilePic) continue;
    console.log(artist);
    if (artist.id === "") continue;
    const artistData = await spotifyApi.getArtist(artist.id);
    await db
      .update(spotifyArtist)
      .set({
        name: artistData.body.name,
        profilePic: artistData.body.images[0]?.url,
        popularity: artistData.body.popularity,
        followers: artistData.body.followers.total,
      })
      .where(eq(spotifyArtist.id, artist.id));
  }
  exit();
};

a();
