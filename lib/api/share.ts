import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

interface CreateShareLinkParams {
  token: string;
  trackId: string;
  organizationId: string;
  shareContent: string[];
  expiredAfter: number;
}

interface CreateShareLinkResponse {
  share_id: string;
  share_url: string;
}

export const createShareLink = async ({
  token,
  trackId,
  organizationId,
  shareContent,
  expiredAfter,
}: CreateShareLinkParams): Promise<CreateShareLinkResponse> => {
  const response = await axios.post<CreateShareLinkResponse>(
    `${API_BASE_URL}/share/track`,
    {
      track_id: trackId,
      organization_id: organizationId,
      share_content: shareContent,
      expired_after: expiredAfter,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

interface SharedTrackResponse {
  track: any; // TrackResponse from backend
  collaborators: any[]; // CollaboratorResponse[] from backend
  allowed_tabs: string[];
  expires_at: string;
}

export const getSharedTrack = async (shareId: string): Promise<SharedTrackResponse> => {
  const response = await axios.get<SharedTrackResponse>(
    `${API_BASE_URL}/share/${shareId}`
  );
  return response.data;
};

export type { CreateShareLinkResponse, SharedTrackResponse };