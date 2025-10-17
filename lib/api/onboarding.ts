const BACKEND_HOST = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

export interface IdentityData {
  legal_name: string;
  artist_name: string;
  organization: string;
  pro: string;
  pro_id: string;
}

export interface OrganizationMember {
  id?: string;
  legal_name?: string;
  artist_name?: string;
  email?: string;
  pro?: string;
  pro_id?: string;
  region?: string;
  profile_link?: string;
  bio?: string;
  phone_number?: string;
  initial_source?: string;
}

export interface BasicInformationRequest {
  identity: IdentityData;
  organization_members?: OrganizationMember[];
}

export interface BasicInformationResponse {
  success: boolean;
  organization_id: string;
  user_collaborator_id: string;
  organization_members: OrganizationMember[];
  message: string;
}

export interface BasicInformationGetResponse {
  identity: IdentityData;
  organization_members: OrganizationMember[];
  organization_id?: string;
}

export async function fetchBasicInformation({
  token,
}: {
  token: string;
}): Promise<BasicInformationGetResponse> {
  const response = await fetch(`${BACKEND_HOST}/onboarding/basic-information`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function saveBasicInformation({
  token,
  data,
}: {
  token: string;
  data: BasicInformationRequest;
}): Promise<BasicInformationResponse> {
  const response = await fetch(`${BACKEND_HOST}/onboarding/basic-information`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export interface InitialDataRequest {
  googleSessionId?: string;
  links: string[];
  uploadedFiles: string[];
  maxStep: number;
  catalogModalCompleted: boolean;
  reviewAndSaveModalCompleted: boolean;
}

export interface InitialDataResponse {
  success: boolean;
}

export async function saveInitialData({
  token,
  data,
}: {
  token: string;
  data: InitialDataRequest;
}): Promise<InitialDataResponse> {
  // Convert camelCase to snake_case for backend
  const backendData = {
    google_session_id: data.googleSessionId,
    links: data.links,
    uploaded_files: data.uploadedFiles,
    max_step: data.maxStep,
    catalog_modal_completed: data.catalogModalCompleted,
    review_and_save_modal_completed: data.reviewAndSaveModalCompleted,
  };

  const response = await fetch(`${BACKEND_HOST}/onboarding/initial-data`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(backendData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export interface FinishOnboardingResponse {
  success: boolean;
}

export async function finishOnboarding({
  token,
}: {
  token: string;
}): Promise<FinishOnboardingResponse> {
  const response = await fetch(`${BACKEND_HOST}/onboarding/finish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}