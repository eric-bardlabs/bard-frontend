import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

interface Album {
  id: string;
  title?: string;
  release_date?: string;
  start_date?: string;
  renewal_date?: string;
  total_tracks?: number;
  album_art_url?: string;
  upc?: string;
  ean?: string;
  isrc?: string;
  spotify_album_id?: string;
  label_collaborator_id?: string;
  label_payout_link?: string;
  label_accounting_start_date?: string;
  label_accounting_end_date?: string;
  publisher_collaborator_id?: string;
  publisher_payout_link?: string;
  publisher_accounting_start_date?: string;
  publisher_accounting_end_date?: string;
  created_at?: string;
  updated_at?: string;
  track_count?: number;
}

interface AlbumsListResponse {
  albums: Album[];
  total: number;
}

interface AlbumTracksResponse {
  tracks: any[];
  total: number;
}

interface FetchAlbumsParams {
  token: string;
  limit?: number;
  offset?: number;
  includeTrackCount?: boolean;
  search?: string;
  onSuccess?: (data: AlbumsListResponse) => void;
  onError?: (error: any) => void;
}

export const fetchAlbums = async ({
  token,
  limit = 100,
  offset = 0,
  includeTrackCount = false,
  search,
  onSuccess,
  onError,
}: FetchAlbumsParams): Promise<AlbumsListResponse> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      include_tracks: includeTrackCount.toString(),
    });

    if (search) {
      params.append("search", search);
    }

    const response = await axios.get<AlbumsListResponse>(
      `${API_BASE_URL}/albums/?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (onSuccess) {
      onSuccess(response.data);
    }

    return response.data;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

interface FetchAlbumParams {
  token: string;
  albumId: string;
  includeTrackCount?: boolean;
  onSuccess?: (data: Album) => void;
  onError?: (error: any) => void;
}

export const fetchAlbum = async ({
  token,
  albumId,
  includeTrackCount = false,
  onSuccess,
  onError,
}: FetchAlbumParams): Promise<Album> => {
  try {
    const params = new URLSearchParams({
      include_tracks: includeTrackCount.toString(),
    });

    const response = await axios.get<Album>(
      `${API_BASE_URL}/albums/${albumId}?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (onSuccess) {
      onSuccess(response.data);
    }

    return response.data;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

interface FetchAlbumTracksParams {
  token: string;
  albumId: string;
  onSuccess?: (data: AlbumTracksResponse) => void;
  onError?: (error: any) => void;
}

export const fetchAlbumTracks = async ({
  token,
  albumId,
  onSuccess,
  onError,
}: FetchAlbumTracksParams): Promise<AlbumTracksResponse> => {
  try {
    const response = await axios.get<AlbumTracksResponse>(
      `${API_BASE_URL}/albums/${albumId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (onSuccess) {
      onSuccess(response.data);
    }

    return response.data;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

interface CreateAlbumParams {
  token: string;
  title: string;
  release_date?: string | null;
  start_date?: string | null;
  renewal_date?: string | null;
  album_art_url?: string | null;
  upc?: string | null;
  ean?: string | null;
  onSuccess?: (data: Album) => void;
  onError?: (error: any) => void;
}

export const createAlbum = async ({
  token,
  title,
  release_date,
  start_date,
  renewal_date,
  album_art_url,
  upc,
  ean,
  onSuccess,
  onError,
}: CreateAlbumParams): Promise<Album> => {
  try {
    const albumData = {
      title,
      release_date,
      start_date,
      renewal_date,
      album_art_url,
      upc,
      ean,
    };

    const response = await axios.post<Album>(
      `${API_BASE_URL}/albums/`,
      albumData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (onSuccess) {
      onSuccess(response.data);
    }

    return response.data;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

// Export types for use in components
export type { Album, AlbumsListResponse, AlbumTracksResponse };