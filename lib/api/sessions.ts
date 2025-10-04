import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

export interface SessionTrackCollaborator {
  id: string;
  legal_name?: string;
  artist_name?: string;
  email?: string;
  role?: string;
  songwriting_split?: number;
  publishing_split?: number;
  master_split?: number;
}

export interface SessionTrack {
  id: string;
  display_name?: string;
  artist_id?: string;
  status?: string;
  collaborators: SessionTrackCollaborator[];
}

export interface SessionCollaborator {
  id: string;
  legal_name?: string;
  artist_name?: string;
  email?: string;
}

export interface Session {
  id: string;
  organization_id?: string;
  title?: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  notes?: string;
  gc_id?: string;
  tracks: SessionTrack[];
  collaborators: SessionCollaborator[];
}

export interface SessionsListResponse {
  sessions: Session[];
  has_more: boolean;
  total?: number;
}

interface CreateSessionData {
  title: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  gc_id?: string;
  track_ids?: string[];
  collaborator_ids?: string[];
}

interface UpdateSessionData {
  title?: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  gc_id?: string;
  track_ids?: string[];
  collaborator_ids?: string[];
}

interface FetchSessionsParams {
  token: string;
  limit?: number;
  offset?: number;
  start_time_from?: string;
  start_time_to?: string;
  onSuccess?: (data: SessionsListResponse) => void;
  onError?: (error: any) => void;
}

interface FetchSessionsForSongParams {
  token: string;
  songId: string;
  limit?: number;
  offset?: number;
  start_time?: string;
  end_time?: string;
  onSuccess?: (data: SessionsListResponse) => void;
  onError?: (error: any) => void;
}

export const fetchSessions = async ({
  token,
  limit = 100,
  offset = 0,
  start_time_from,
  start_time_to,
  onSuccess,
  onError,
}: FetchSessionsParams): Promise<SessionsListResponse> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (start_time_from) params.append("start_time_from", start_time_from);
    if (start_time_to) params.append("start_time_to", start_time_to);

    const response = await axios.get<SessionsListResponse>(
      `${API_BASE_URL}/sessions/?${params}`,
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

export const fetchSessionsForSong = async ({
  token,
  songId,
  limit = 20,
  offset = 0,
  start_time,
  end_time,
  onSuccess,
  onError,
}: FetchSessionsForSongParams): Promise<SessionsListResponse> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (start_time) params.append("start_time", start_time);
    if (end_time) params.append("end_time", end_time);

    const response = await axios.get<SessionsListResponse>(
      `${API_BASE_URL}/sessions/for-song/${songId}?${params}`,
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

interface FetchSessionParams {
  token: string;
  sessionId: string;
  onSuccess?: (data: Session) => void;
  onError?: (error: any) => void;
}

export const fetchSession = async ({
  token,
  sessionId,
  onSuccess,
  onError,
}: FetchSessionParams): Promise<Session> => {
  try {
    const response = await axios.get<Session>(
      `${API_BASE_URL}/sessions/${sessionId}`,
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

interface CreateSessionParams {
  token: string;
  data: CreateSessionData;
  onSuccess?: (data: Session) => void;
  onError?: (error: any) => void;
}

export const createSession = async ({
  token,
  data,
  onSuccess,
  onError,
}: CreateSessionParams): Promise<Session> => {
  try {
    const response = await axios.post<Session>(
      `${API_BASE_URL}/sessions/`,
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

interface UpdateSessionParams {
  token: string;
  sessionId: string;
  updates: UpdateSessionData;
  onSuccess?: (data: Session) => void;
  onError?: (error: any) => void;
}

export const updateSession = async ({
  token,
  sessionId,
  updates,
  onSuccess,
  onError,
}: UpdateSessionParams): Promise<Session> => {
  try {
    const response = await axios.put<Session>(
      `${API_BASE_URL}/sessions/${sessionId}`,
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

interface DeleteSessionParams {
  token: string;
  sessionId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const deleteSession = async ({
  token,
  sessionId,
  onSuccess,
  onError,
}: DeleteSessionParams): Promise<void> => {
  try {
    await axios.delete(
      `${API_BASE_URL}/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

interface SyncCalendarParams {
  token: string;
  start_time: string;
  end_time: string;
  onSuccess?: (data: { success: boolean; events_synced: number; message: string }) => void;
  onError?: (error: any) => void;
}

export const syncCalendar = async ({
  token,
  start_time,
  end_time,
  onSuccess,
  onError,
}: SyncCalendarParams): Promise<{ success: boolean; events_synced: number; message: string }> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/calendar/sync`,
      {
        start_time,
        end_time,
      },
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
    // Don't throw the error, just return a safe response
    // This prevents the calendar from breaking if sync fails
    return {
      success: false,
      events_synced: 0,
      message: "Failed to sync calendar",
    };
  }
};

// Export types for use in components
export type { 
  CreateSessionData, 
  UpdateSessionData,
  FetchSessionsParams,
  FetchSessionsForSongParams,
};