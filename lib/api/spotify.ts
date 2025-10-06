import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

export interface TrackInfo {
  name: string;
  artist_name: string;
  album_name: string;
  collaborators?: string[];
}

export interface SpotifyImportResponse {
  success: boolean;
  type: string;
  imported: number;
  total?: number;
  tracks: TrackInfo[];
  message: string;
}

export interface SpotifyImportRequest {
  type: "track" | "album" | "playlist" | "artist";
  spotifyId: string;
  organizationId: string;
}

export const importFromSpotify = async (
  request: SpotifyImportRequest,
  token: string
): Promise<SpotifyImportResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/spotify/import`,
      {
        type: request.type,
        spotify_id: request.spotifyId,
        organization_id: request.organizationId,
      },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || error.response.data.error || "Import failed");
    }
    throw new Error("An unexpected error occurred while importing from Spotify");
  }
};