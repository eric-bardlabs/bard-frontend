import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

export interface RelatedSong {
  id: string;
  display_name: string;
}

export interface RelatedCollaborator {
  id: string;
  legal_name?: string;
  artist_name?: string;
  email?: string;
}

export interface CollaboratorRelationships {
  managers: RelatedCollaborator[];
  members: RelatedCollaborator[];
  publishing_entities: RelatedCollaborator[];
}

export interface Collaborator {
  id: string;
  legal_name?: string;
  artist_name?: string;
  email?: string;
  pro?: string;
  pro_id?: string;
  phone_number?: string;
  region?: string;
  profile_link?: string;
  bio?: string;
  initial_source?: string;
  clerk_user_id?: string;
  created_at?: string;
  updated_at?: string;
  related_songs?: RelatedSong[];
  relationships?: CollaboratorRelationships;
}

export interface CollaboratorsListResponse {
  collaborators: Collaborator[];
  total: number;
}

interface SaveCollaboratorParams {
  token: string;
  collaboratorData: {
    legal_name?: string;
    artist_name?: string;
    email?: string;
    region?: string;
    pro?: string;
    pro_id?: string;
    profile_link?: string;
    bio?: string;
    phone_number?: string;
    initial_source?: string;
    [key: string]: any;
  };
  onSuccess?: (data: { id: string; [key: string]: any }) => void;
  onError?: (error: any) => void;
}

export const saveCollaborator = async ({
  token,
  collaboratorData,
  onSuccess,
  onError,
}: SaveCollaboratorParams) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/collaborators/`,
      {
        ...collaboratorData,
        // Note: organizationId is extracted from token in backend
      },
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

interface UpdateCollaboratorParams {
  token: string;
  id: string;
  updates: {
    legal_name?: string;
    artist_name?: string;
    email?: string;
    region?: string;
    pro?: string;
    pro_id?: string;
    profile_link?: string;
    bio?: string;
    phone_number?: string;
    [key: string]: any;
  };
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const updateCollaborator = async ({
  token,
  id,
  updates,
  onSuccess,
  onError,
}: UpdateCollaboratorParams) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/collaborators/${id}`,
      updates,
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

interface FetchCollaboratorsParams {
  token: string;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  initialSource?: string;
  includeRelatedSongs?: boolean;
  includeRelationships?: boolean;
  onSuccess?: (data: CollaboratorsListResponse) => void;
  onError?: (error: any) => void;
}

interface FetchCollaboratorParams {
  token: string;
  id: string;
  onSuccess?: (data: Collaborator) => void;
  onError?: (error: any) => void;
}

export const fetchCollaborator = async ({
  token,
  id,
  onSuccess,
  onError,
}: FetchCollaboratorParams): Promise<Collaborator> => {
  try {
    const response = await axios.get<Collaborator>(
      `${API_BASE_URL}/collaborators/${id}`,
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

export const fetchCollaborators = async ({
  token,
  limit = 500,
  offset = 0,
  search,
  sortBy,
  sortOrder,
  initialSource,
  includeRelatedSongs = false,
  includeRelationships = false,
  onSuccess,
  onError,
}: FetchCollaboratorsParams): Promise<CollaboratorsListResponse> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      include_related_songs: includeRelatedSongs.toString(),
      include_relationships: includeRelationships.toString(),
    });

    if (search) params.append("search", search);
    if (sortBy) params.append("sort_by", sortBy);
    if (sortOrder) params.append("sort_order", sortOrder);
    if (initialSource) params.append("initial_source", initialSource);

    const response = await axios.get<CollaboratorsListResponse>(
      `${API_BASE_URL}/collaborators/?${params}`,
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

interface DeleteCollaboratorParams {
  token: string;
  id: string;
  replacementCollaboratorId?: string;
  onSuccess?: (data: {
    success: boolean;
    message: string;
    affected_tracks: number;
    affected_sessions: number;
  }) => void;
  onError?: (error: any) => void;
}

export const deleteCollaborator = async ({
  token,
  id,
  replacementCollaboratorId,
  onSuccess,
  onError,
}: DeleteCollaboratorParams) => {
  try {
    const params = replacementCollaboratorId 
      ? `?replacement_collaborator_id=${replacementCollaboratorId}`
      : '';
    
    const response = await axios.delete(
      `${API_BASE_URL}/collaborators/${id}${params}`,
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

// Relationship management functions

interface UpdateCollaboratorRelationshipsParams {
  token: string;
  collaboratorId: string;
  managers: string[];
  members: string[];
  publishing_entities: string[];
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const updateCollaboratorRelationships = async ({
  token,
  collaboratorId,
  managers,
  members,
  publishing_entities,
  onSuccess,
  onError,
}: UpdateCollaboratorRelationshipsParams) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/collaborators/${collaboratorId}/relationships`,
      {
        managers,
        members,
        publishing_entities,
      },
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

interface CreateCollaboratorRelationshipParams {
  token: string;
  collaboratorId: string;
  targetCollaboratorId: string;
  relationshipType: 'manager' | 'member' | 'publishing_entity';
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const createCollaboratorRelationship = async ({
  token,
  collaboratorId,
  targetCollaboratorId,
  relationshipType,
  onSuccess,
  onError,
}: CreateCollaboratorRelationshipParams) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/collaborators/${collaboratorId}/relationships`,
      {
        target_collaborator_id: targetCollaboratorId,
        relationship_type: relationshipType,
      },
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

interface DeleteCollaboratorRelationshipParams {
  token: string;
  collaboratorId: string;
  targetId: string;
  relationshipType: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const deleteCollaboratorRelationship = async ({
  token,
  collaboratorId,
  targetId,
  relationshipType,
  onSuccess,
  onError,
}: DeleteCollaboratorRelationshipParams) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/collaborators/${collaboratorId}/relationships/${targetId}?relationship_type=${relationshipType}`,
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

interface FetchMyCollaboratorProfileParams {
  token: string;
  onSuccess?: (data: Collaborator | null) => void;
  onError?: (error: any) => void;
}

export const fetchMyCollaboratorProfile = async ({
  token,
  onSuccess,
  onError,
}: FetchMyCollaboratorProfileParams): Promise<Collaborator | null> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/collaborators/me/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Return null if empty response (no profile found)
    const data = Object.keys(response.data).length === 0 ? null : response.data;
    
    if (onSuccess) {
      onSuccess(data);
    }
    
    return data;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

// Merge collaborators functionality

export interface ConflictValue {
  source_id: string;
  source_name: string;
  value?: string;
}

export interface ConflictField {
  field_name: string;
  values: ConflictValue[];
}

export interface MergeCollaboratorsRequest {
  target_collaborator_id: string;
  source_collaborator_ids: string[];
  resolved_conflicts?: Record<string, string>;
}

export interface MergeCollaboratorsResponse {
  success: boolean;
  message: string;
  conflicts?: ConflictField[];
  merged_collaborator_id?: string;
  affected_songs?: number;
  affected_sessions?: number;
}

interface MergeCollaboratorsParams {
  token: string;
  targetCollaboratorId: string;
  sourceCollaboratorIds: string[];
  resolvedConflicts?: Record<string, string>;
  onSuccess?: (data: MergeCollaboratorsResponse) => void;
  onError?: (error: any) => void;
}

export const mergeCollaborators = async ({
  token,
  targetCollaboratorId,
  sourceCollaboratorIds,
  resolvedConflicts,
  onSuccess,
  onError,
}: MergeCollaboratorsParams): Promise<MergeCollaboratorsResponse> => {
  try {
    const response = await axios.post<MergeCollaboratorsResponse>(
      `${API_BASE_URL}/collaborators/merge`,
      {
        target_collaborator_id: targetCollaboratorId,
        source_collaborator_ids: sourceCollaboratorIds,
        resolved_conflicts: resolvedConflicts,
      },
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
