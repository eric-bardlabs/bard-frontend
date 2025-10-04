export interface Event {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    color: string;
    selectedSongs?: string[];
    selectedCollaborators?: string[];
  }