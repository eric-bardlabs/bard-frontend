import spotifyApi from "@/api_clients/spotify/SpotifyAPIClient";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import querystring from "querystring";

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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query } = req.body;
  const token = await getAccessToken();
  spotifyApi.setAccessToken(token.access_token);

  const results = await spotifyApi.searchAlbums(query);

  res.status(200).json({ albums: results.body.albums?.items });
}
