
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
    legalName: string;
    artistName: string;
    organization: string;
    pro: string;
    proId: string;
  };
  organizationMembers?: {
    id?: string;
    legalName: string;
    artistName: string;
    email?: string;
    pro?: string;
    proId?: string;
    region?: string;
    profileLink?: string;
    bio?: string;
    phoneNumber?: string;
    initialSource?: string;
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