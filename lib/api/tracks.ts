import axios from "axios";
import { Collaborator } from "./collaborators";

const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

interface TrackCollaborator {
  id: string;
  role?: string;  // Role: performance, writing, production, etc.
  legal_name?: string;
  artist_name?: string;
  email?: string;
  songwriting_split?: number;
  publishing_split?: number;
  master_split?: number;
  collaborator_profile?: Collaborator;
}

interface TrackCollaboratorInput {
  id: string;
  role?: string;  // Role: performance, writing, production, etc.
  songwriting_split?: number;
  master_split?: number;
  publishing_split?: number;
}

interface CreateTrackData {
  display_name: string;
  album_id?: string;
  artist_id?: string;
  spotify_track_id?: string;
  duration_ms?: number;
  isrc?: string;
  upc?: string;
  sixid?: string;
  status?: string;
  release_date?: string;
  project_start_date?: string;
  pitch?: string;
  initial_source?: string;
  notes?: string;
  splits_confirmation_status?: string;
  registration_status?: string;
  master_fee_status?: string;
  master_fee_amount?: number;
  collaborators?: TrackCollaboratorInput[];
}

interface UpdateTrackData {
  display_name?: string;
  album_id?: string;
  artist_id?: string;
  spotify_track_id?: string;
  duration_ms?: number;
  isrc?: string;
  status?: string;
  release_date?: string;
  project_start_date?: string;
  pitch?: string;
  sync?: string;
  ean?: string;
  upc?: string;
  sixid?: string;
  initial_source?: string;
  notes?: string;
  splits_confirmation_status?: string;
  registration_status?: string;
  master_fee_status?: string;
  master_fee_amount?: number;
  collaborators?: TrackCollaboratorInput[];
}

export interface Track {
  id: string;
  display_name: string;
  spotify_track_id?: string;
  duration_ms?: number;
  isrc?: string;
  status?: string;
  release_date?: string;
  project_start_date?: string;
  artist_id?: string;
  artist?: TrackCollaborator;
  album_id?: string;
  album?: {
    id: string;
    title?: string;
  };
  organization_id?: string;
  spotify_code?: string;
  apple_code?: string;
  sxid?: string;
  sixid?: string;
  ean?: string;
  upc?: string;
  sync?: string;
  splits_confirmation_status?: string;
  registration_status?: string;
  master_fee_status?: string;
  master_fee_amount?: number;
  pitch?: string;
  initial_source?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  collaborator_count?: number;
  collaborators?: TrackCollaborator[];
}

interface TracksListResponse {
  tracks: Track[];
  total: number;
}

interface DeleteTrackResponse {
  success: boolean;
  message: string;
  collaborators_removed: number;
  external_links_removed: number;
  sessions_affected: number;
}

interface CreateTrackParams {
  token: string;
  data: CreateTrackData;
  onSuccess?: (data: Track) => void;
  onError?: (error: any) => void;
}

export const createTrack = async ({
  token,
  data,
  onSuccess,
  onError,
}: CreateTrackParams): Promise<Track> => {
  try {
    const response = await axios.post<Track>(
      `${API_BASE_URL}/tracks/`,
      data,
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

interface UpdateTrackParams {
  token: string;
  trackId: string;
  updates: UpdateTrackData;
  onSuccess?: (data: Track) => void;
  onError?: (error: any) => void;
}

export const getTrack = async (
  trackId: string,
  token: string
): Promise<Track> => {
  const response = await axios.get<Track>(
    `${API_BASE_URL}/tracks/${trackId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const updateTrack = async ({
  token,
  trackId,
  updates,
  onSuccess,
  onError,
}: UpdateTrackParams): Promise<Track> => {
  try {
    const response = await axios.put<Track>(
      `${API_BASE_URL}/tracks/${trackId}`,
      updates,
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

interface DeleteTrackParams {
  token: string;
  trackId: string;
  onSuccess?: (data: DeleteTrackResponse) => void;
  onError?: (error: any) => void;
}

export const deleteTrack = async ({
  token,
  trackId,
  onSuccess,
  onError,
}: DeleteTrackParams): Promise<DeleteTrackResponse> => {
  try {
    const response = await axios.delete<DeleteTrackResponse>(
      `${API_BASE_URL}/tracks/${trackId}`,
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

interface FetchTrackParams {
  token: string;
  trackId: string;
  includeCollaborators?: boolean;
  onSuccess?: (data: Track) => void;
  onError?: (error: any) => void;
}

export const fetchTrack = async ({
  token,
  trackId,
  includeCollaborators = false,
  onSuccess,
  onError,
}: FetchTrackParams): Promise<Track> => {
  try {
    const params = new URLSearchParams({
      include_collaborators: includeCollaborators.toString(),
    });

    const response = await axios.get<Track>(
      `${API_BASE_URL}/tracks/${trackId}?${params}`,
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

interface FetchTracksParams {
  token: string;
  limit?: number;
  offset?: number;
  albumId?: string | string[];
  artistId?: string;
  status?: string | string[];
  search?: string;
  releaseDateStart?: string;
  releaseDateEnd?: string;
  initialSource?: string;
  sortBy?: string;
  sortOrder?: string;
  splitsConfirmationStatus?: string;
  includeCollaborators?: boolean;
  onSuccess?: (data: TracksListResponse) => void;
  onError?: (error: any) => void;
}

export const fetchTracks = async ({
  token,
  limit = 500,
  offset = 0,
  albumId,
  artistId,
  status,
  search,
  releaseDateStart,
  releaseDateEnd,
  initialSource,
  sortBy,
  sortOrder,
  splitsConfirmationStatus,
  onSuccess,
  onError,
}: FetchTracksParams): Promise<TracksListResponse> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    // Handle multiple album IDs
    if (albumId) {
      if (Array.isArray(albumId)) {
        albumId.forEach(id => params.append("album_id", id));
      } else {
        params.append("album_id", albumId);
      }
    }
    
    if (artistId) params.append("artist_id", artistId);
    
    // Handle multiple statuses
    if (status) {
      if (Array.isArray(status)) {
        status.forEach(s => params.append("status", s));
      } else {
        params.append("status", status);
      }
    }
    
    if (search) params.append("search", search);
    if (releaseDateStart) params.append("release_date_start", releaseDateStart);
    if (releaseDateEnd) params.append("release_date_end", releaseDateEnd);
    if (initialSource) params.append("initial_source", initialSource);
    if (sortBy) params.append("sort_by", sortBy);
    if (sortOrder) params.append("sort_order", sortOrder);
    if (splitsConfirmationStatus) params.append("splits_confirmation_status", splitsConfirmationStatus);

    const response = await axios.get<TracksListResponse>(
      `${API_BASE_URL}/tracks/?${params}`,
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

// Export types for use in components
export type { 
  TracksListResponse, 
  CreateTrackData, 
  UpdateTrackData, 
  TrackCollaborator,
  TrackCollaboratorInput,
  DeleteTrackResponse 
};