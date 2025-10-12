
export interface OnboardingFormData {
  googleSessionId: string | null;
  links: string[];
  uploadedFiles: string[];
  maxStep: number;
  catalogModalCompleted?: boolean;
  reviewAndSaveModalCompleted?: boolean;
}

export interface BasicInformationData {
  identity: {
    legal_name: string;
    artist_name: string;
    organization: string;
    pro: string;
    pro_id: string;
  };
  organization_members?: {
    id?: string;
    legal_name: string;
    artist_name: string;
    email?: string;
    pro?: string;
    pro_id?: string;
    region?: string;
    profile_link?: string;
    bio?: string;
    phone_number?: string;
    initial_source?: string;
  }[];
}


export type SplitType = "songwriting" | "publishing" | "master";

export const STEPS = {
  BASIC_INFO: 0,
  CATALOG_INPUT: 1,
  SPOTIFY_IMPORT: 2,
  CALENDAR_CONNECT: 3,
  FILE_UPLOAD: 4,
  CATALOG_REVIEW: 5,
  COLLABORATORS: 6,
  SONGS: 7,
  SPLITS: 8,
  COMPLETE: 9,
} as const;