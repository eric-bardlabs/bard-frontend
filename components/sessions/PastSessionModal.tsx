"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Divider,
  Card,
  CardBody,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { TrackMultiSelect, TrackOption } from "@/components/songs/track-multi-select";
import { CollaboratorMultiSelect } from "@/components/collaborator/collaboratorMultiSelect";
import { CollaboratorSelection } from "@/components/collaborator/types";
import { SplitsTable } from "../home/splitsTable";
import { SimpleNewSongModal } from "@/components/songs/simple-new-song-modal";
import { CollaboratorModal } from "@/components/collaborator/CollaboratorModal";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSession, updateSession } from "@/lib/api/sessions";
import { updateTrack, Track } from "@/lib/api/tracks";
import { toast } from "sonner";
import dayjs from "dayjs";
import { Calendar, Clock, MapPin, X } from "lucide-react";

interface PastSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSessionUpdated?: () => void;
}

type SplitRow = {
  id: string;
  collaboratorName?: string;
  collaboratorEmail?: string;
  songwriting: string | number;
  publishing: string | number;
  master: string | number;
};

export const PastSessionModal: React.FC<PastSessionModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  onSessionUpdated,
}) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedSongs, setSelectedSongs] = useState<TrackOption[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<CollaboratorSelection[]>([]);
  const [expandedSongs, setExpandedSongs] = useState<Set<string>>(new Set());
  const [songSplits, setSongSplits] = useState<Record<string, SplitRow[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);

  // Fetch session data
  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      return fetchSession({ token, sessionId });
    },
    enabled: isOpen && !!sessionId,
  });

  // Remove tracksQuery - track collaborator data comes from session endpoint

  const session = sessionQuery.data;

  // Initialize form data and splits when session loads (initialization only)
  useEffect(() => {
    if (session) {
      const sessionSongs = session.tracks?.map(track => ({
        value: track.id,
        label: track.display_name || "Untitled"
      })) || [];
      
      const sessionCollaborators = session.collaborators?.map(collab => ({
        id: collab.id,
        label: collab.artist_name || collab.legal_name || "Unknown",
        subtitle: collab.email || ""
      })) || [];

      setSelectedSongs(sessionSongs);
      setSelectedCollaborators(sessionCollaborators);

      // Initialize splits data for session tracks
      const initialSongSplits: Record<string, SplitRow[]> = {};
      
      session.tracks?.forEach((track) => {
        const existingSplits: SplitRow[] = track.collaborators?.map((collab) => ({
          id: collab.id,
          collaboratorName: collab.artist_name || collab.legal_name || "",
          collaboratorEmail: collab.email || "",
          songwriting: collab.songwriting_split?.toString() || "0",
          publishing: collab.publishing_split?.toString() || "0",
          master: collab.master_split?.toString() || "0",
        })) || [];
        
        // Get existing collaborator IDs from splits
        const existingCollaboratorIds = new Set(existingSplits.map(split => split.id));
        
        // Add session collaborators who aren't already in the splits
        const additionalSplits: SplitRow[] = sessionCollaborators
          .filter(collab => !existingCollaboratorIds.has(collab.id))
          .map(collab => ({
            id: collab.id,
            collaboratorName: collab.label,
            collaboratorEmail: collab.subtitle || "",
            songwriting: "0",
            publishing: "0",
            master: "0",
          }));
        
        initialSongSplits[track.id] = [...existingSplits, ...additionalSplits];
      });
      
      setSongSplits(initialSongSplits);
    }
  }, [session]);

  // Handle collaborator changes - add/remove from all songs' splits
  useEffect(() => {
    if (selectedSongs.length > 0) {
      setSongSplits(prev => {
        const newSplits = { ...prev };
        
        selectedSongs.forEach(song => {
          const songId = song.value;
          const currentSplits = newSplits[songId] || [];
          
          // Get current collaborator IDs in splits
          const currentCollabIds = new Set(currentSplits.map(split => split.id));

          const newCollaborators = selectedCollaborators
            .filter(collab => !currentCollabIds.has(collab.id))
            .map(collab => ({
              id: collab.id,
              collaboratorName: collab.label,
              collaboratorEmail: collab.subtitle || "",
              songwriting: "0",
              publishing: "0",
              master: "0",
            }));
          newSplits[songId] = [...currentSplits, ...newCollaborators];
        });
        return newSplits;
      });
    }
  }, [selectedCollaborators, selectedSongs]);

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (data: { track_ids: string[]; collaborator_ids: string[] }) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      return updateSession({ token, sessionId, updates: data });
    },
    onSuccess: () => {
      toast.success("Session updated successfully");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      onSessionUpdated?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error("Failed to update session: " + (error.message || "Unknown error"));
    },
  });

  // Update splits mutation
  const updateSplitsMutation = useMutation({
    mutationFn: async ({ songId, splits }: { songId: string; splits: SplitRow[] }) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const collaborators = splits.map(split => ({
        id: split.id,
        songwriting_split: parseFloat(split.songwriting?.toString() || "0"),
        publishing_split: parseFloat(split.publishing?.toString() || "0"),
        master_split: parseFloat(split.master?.toString() || "0"),
      }));
      
      return updateTrack({
        token,
        trackId: songId,
        updates: { collaborators },
      });
    },
    onSuccess: () => {
      toast.success("Splits updated successfully");
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: (error: any) => {
      toast.error("Failed to update splits: " + (error.message || "Unknown error"));
    },
  });

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Update session songs and collaborators
      await updateSessionMutation.mutateAsync({
        track_ids: selectedSongs.map(song => song.value),
        collaborator_ids: selectedCollaborators.map(collab => collab.id),
      });

      // Update splits for expanded songs
      for (const songId of Array.from(expandedSongs)) {
        const splits = songSplits[songId];
        if (splits && splits.length > 0) {
          await updateSplitsMutation.mutateAsync({ songId, splits });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSongExpanded = (songId: string) => {
    setExpandedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  const handleSplitRowChange = (songId: string, index: number, field: string, value: string | number | { id: string; name: string; email: string }) => {
    setSongSplits(prev => ({
      ...prev,
      [songId]: prev[songId]?.map((row, i) => {
        if (i === index) {
          if (field === "collaborator" && typeof value === "object") {
            // Handle collaborator selection
            return { 
              ...row, 
              id: value.id,
              collaboratorName: value.name,
              collaboratorEmail: value.email
            };
          } else {
            // Handle regular field updates
            return { ...row, [field]: value };
          }
        }
        return row;
      }) || []
    }));
  };

  const addSplitRow = (songId: string) => {
    setSongSplits(prev => ({
      ...prev,
      [songId]: [...(prev[songId] || []), { id: '', collaboratorName: '', collaboratorEmail: '', songwriting: '0', publishing: '0', master: '0' }]
    }));
  };

  const removeSplitRow = (songId: string, index: number) => {
    setSongSplits(prev => ({
      ...prev,
      [songId]: prev[songId]?.filter((_, i) => i !== index) || []
    }));
  };

  const calculateTotals = (splits: SplitRow[]) => ({
    songwriting: splits.reduce((sum, row) => sum + parseFloat(row.songwriting?.toString() || "0"), 0),
    publishing: splits.reduce((sum, row) => sum + parseFloat(row.publishing?.toString() || "0"), 0),
    master: splits.reduce((sum, row) => sum + parseFloat(row.master?.toString() || "0"), 0),
  });

  // Handle when a track is selected - use fresh data from TrackMultiSelect
  const handleTrackSelect = (track: Track) => {
    const existingSplits: SplitRow[] = track.collaborators?.map((collab) => ({
      id: collab.id,
      collaboratorName: collab.artist_name || collab.legal_name || "",
      collaboratorEmail: collab.email || "",
      songwriting: collab.songwriting_split?.toString() || "0",
      publishing: collab.publishing_split?.toString() || "0",
      master: collab.master_split?.toString() || "0",
    })) || [];

    // Get existing collaborator IDs from splits
    const existingCollaboratorIds = new Set(existingSplits.map(split => split.id));

    // Add selected collaborators who aren't already in the splits
    const additionalSplits: SplitRow[] = selectedCollaborators
      .filter(collab => !existingCollaboratorIds.has(collab.id))
      .map(collab => ({
        id: collab.id,
        collaboratorName: collab.label,
        collaboratorEmail: collab.subtitle || "",
        songwriting: "0",
        publishing: "0",
        master: "0",
      }));

    setSongSplits(prev => ({
      ...prev,
      [track.id]: [...existingSplits, ...additionalSplits]
    }));
  };

  // Handle when a track is unselected
  const handleTrackUnselect = (trackId: string) => {
    setSongSplits(prev => {
      const newSplits = { ...prev };
      delete newSplits[trackId];
      return newSplits;
    });
  };

  if (sessionQuery.isLoading) {
    return (
      <Modal isOpen={isOpen} onOpenChange={onClose} size="4xl">
        <ModalContent>
          <ModalBody className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Session Completed</h2>
          <p className="text-sm text-gray-500">Edit songs, collaborators, and splits for completed session</p>
        </ModalHeader>
        
        <ModalBody className="gap-4">
          {/* Read-only session information */}
          <Card className="bg-gray-50 flex-shrink-0">
            <CardBody className="p-4">
              <h3 className="font-semibold mb-3">Session Information</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
                  <strong className="text-left">Title:</strong>
                  <span className="break-words">{session?.title || "Untitled Session"}</span>
                </div>
                {session?.description && (
                  <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
                    <strong className="text-left">Description:</strong>
                    <span className="break-words">{session.description}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {session?.start_time && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{dayjs(session.start_time).format("MMM D, YYYY")}</span>
                    </div>
                  )}
                  {session?.start_time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>
                        {dayjs(session.start_time).format("h:mm A")}
                        {session.end_time && ` - ${dayjs(session.end_time).format("h:mm A")}`}
                      </span>
                    </div>
                  )}
                  {session?.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{session.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <Divider />

          {/* Editable songs section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Songs</h3>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onPress={() => setIsAddingSong(true)}
                isDisabled={isSubmitting}
              >
                <Icon icon="lucide:plus" className="mr-1" width={16} />
                Add New Song
              </Button>
              <SimpleNewSongModal
                isOpen={isAddingSong}
                onClose={() => setIsAddingSong(false)}
                successCallback={(songId, songData) => {
                  setIsAddingSong(false);
                  queryClient.invalidateQueries({ queryKey: ["sessions"] });
                  queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
                  // Automatically add the newly created song to selectedSongs
                  if (songId && songData) {
                    const newSong: TrackOption = {
                      value: songId,
                      label: songData.display_name || "New Song",
                    };
                    setSelectedSongs(prev => [...prev, newSong]);
                  }
                }}
              />
            </div>
            <TrackMultiSelect
              title="Select songs..."
              defaultSelected={selectedSongs}
              setSelected={setSelectedSongs}
              onSelect={handleTrackSelect}
              onUnselect={handleTrackUnselect}
            />

            {/* Splits editing for each song */}
            {selectedSongs.length > 0 && (
              <div className="mt-4 space-y-4">
                {selectedSongs.map((selectedSong) => {
                  const song = session?.tracks?.find(s => s.id === selectedSong.value);
                  const isExpanded = expandedSongs.has(selectedSong.value);
                  const splits = songSplits[selectedSong.value] || [];
                  
                  return (
                    <Card key={selectedSong.value} className="border">
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{song?.display_name || selectedSong.label}</h4>
                            <p className="text-sm text-gray-500">
                              {splits.length > 0 ? `${splits.length} collaborators` : "No splits defined"}
                            </p>
                          </div>
                          <Button
                            variant="light"
                            size="sm"
                            onPress={() => toggleSongExpanded(selectedSong.value)}
                            endContent={
                              <Icon 
                                icon={isExpanded ? "lucide:chevron-up" : "lucide:chevron-down"} 
                                className="w-4 h-4" 
                              />
                            }
                          >
                            {isExpanded ? "Hide" : "Edit"} Splits
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="mt-4">
                            <SplitsTable
                              splitRows={splits}
                              onSplitRowChange={(index, field, value) => 
                                handleSplitRowChange(selectedSong.value, index, field, value)
                              }
                              onAddRow={() => addSplitRow(selectedSong.value)}
                              onRemoveRow={(index) => removeSplitRow(selectedSong.value, index)}
                              totals={calculateTotals(splits)}
                            />
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Divider />

          {/* Editable collaborators section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Collaborators</h3>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onPress={() => setIsAddingCollaborator(true)}
                isDisabled={isSubmitting}
              >
                <Icon icon="lucide:plus" className="mr-1" width={16} />
                Add New Collaborator
              </Button>
              <CollaboratorModal
                isOpen={isAddingCollaborator}
                onClose={() => setIsAddingCollaborator(false)}
                successCallback={(collaboratorId, collaboratorData) => {
                  setIsAddingCollaborator(false);
                  queryClient.invalidateQueries({ queryKey: ["sessions"] });
                  queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
                  // Automatically add the newly created collaborator to selectedCollaborators
                  if (collaboratorId && collaboratorData) {
                    const newCollaborator: CollaboratorSelection = {
                      id: collaboratorId,
                      label: collaboratorData.artist_name || collaboratorData.legal_name || "New Collaborator",
                      subtitle: collaboratorData.email || "",
                    };
                    setSelectedCollaborators(prev => [...prev, newCollaborator]);
                  }
                }}
              />
            </div>
            <CollaboratorMultiSelect
              title="Select collaborators..."
              defaultSelected={selectedCollaborators}
              setSelected={setSelectedCollaborators}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSave}
            isLoading={isSubmitting}
            className="bg-black text-white"
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};