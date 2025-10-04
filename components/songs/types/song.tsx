export interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumId: string;
  status: string;
  collaborators: string[];
  created: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
}

export interface SongSplit {
  collaboratorId: string;
  percentage: number;
}

export interface Album {
  id: string;
  name: string;
  coverUrl: string;
}

export const STATUSES = [
  "Draft",
  "Pending",
  "Confirmed",
  "Hold",
  "Pitch",
  "Release",
  "Catalog",
];

export const REGISTRATION_STATUSES = [
  "Registered",
  "Songtrust",
  "Not Registered",
];

export const MASTER_FEE_STATUSES = ["Outstanding", "Pending", "Paid", "Recouping", "Recouped"]
