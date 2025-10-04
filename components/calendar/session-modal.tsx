"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  DatePicker,
  Spinner,
} from "@heroui/react";
import { SimpleNewSongModal } from "@/components/songs/simple-new-song-modal";
import { Icon } from "@iconify/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { useSessionContext } from "./session-provider";
import { useOrganization, useAuth } from "@clerk/nextjs";
import { CollaboratorModal } from "@/components/collaborator/CollaboratorModal";
import { createSession, updateSession, deleteSession, SessionTrack, SessionCollaborator } from "@/lib/api/sessions";
import { toast } from "sonner";
import { CollaboratorMultiSelect } from "@/components/collaborator/collaboratorMultiSelect";
import { CollaboratorSelection } from "@/components/collaborator/types";
import { TrackMultiSelect, TrackOption } from "@/components/track-multi-select";

export const SessionModal: React.FC = () => {
  const { organization } = useOrganization();
  const { getToken } = useAuth();

  const {
    isModalOpen,
    closeModal,
    currentSession,
    initialStartDate,
    initialEndDate,
    refreshSessions,
    isLoading: sessionsLoading,
  } = useSessionContext();

  const [isAddingSong, setIsAddingSong] = React.useState(false);
  const [isAddingCollaborator, setIsAddingCollaborator] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startDate, setStartDate] = React.useState(today(getLocalTimeZone()));
  const [endDate, setEndDate] = React.useState(today(getLocalTimeZone()));
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("10:00");
  const [selectedSongs, setSelectedSongs] = React.useState<TrackOption[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = React.useState<
    CollaboratorSelection[]
  >([]);
  const [isDescriptionModified, setIsDescriptionModified] =
    React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Generate description based on selected songs and collaborators
  const generateDescription = React.useCallback(() => {
    if (isDescriptionModified) return;

    let generatedDescription = "";
    generatedDescription +=
      "Session created by: " + organization?.name + "\n\n";

    generatedDescription += `Start: ${startDate.year}-${startDate.month}-${startDate.day} ${startTime}\n`;

    generatedDescription += `End: ${endDate.year}-${endDate.month}-${endDate.day} ${endTime}\n`;

    generatedDescription += `Title: ${title}\n`;
    // Add songs information
    if (selectedSongs.length > 0) {
      const songsList = selectedSongs
        .map((song) => song.label)
        .filter(Boolean)
        .join(", ");

      generatedDescription += `Songs: ${songsList}`;
    }

    // Add collaborators information
    if (selectedCollaborators.length > 0) {
      if (generatedDescription) generatedDescription += "\n\n";

      const collaboratorsList = selectedCollaborators
        .map((collaborator) => collaborator.label)
        .filter(Boolean)
        .join(", ");

      generatedDescription += `Collaborators: ${collaboratorsList}`;
    }

    setDescription(generatedDescription);
  }, [
    selectedSongs,
    selectedCollaborators,
    isDescriptionModified,
    title,
    startDate,
    endDate,
  ]);

  // Update description when songs or collaborators change
  React.useEffect(() => {
    generateDescription();
  }, [selectedSongs, selectedCollaborators, generateDescription]);

  React.useEffect(() => {
    if (currentSession) {
      setTitle(currentSession.title || "");
      setDescription(currentSession.description || "");
      setIsDescriptionModified(!!currentSession.description);

      const start = currentSession.start_time ? new Date(currentSession.start_time) : null;
      const end = currentSession.end_time ? new Date(currentSession.end_time) : null;

      setStartDate(parseDate(start?.toISOString().split("T")[0] || ""));
      setEndDate(parseDate(end?.toISOString().split("T")[0] || ""));

      setStartTime(
        `${String(start?.getHours()).padStart(2, "0")}:${String(start?.getMinutes()).padStart(2, "0")}`
      );
      setEndTime(
        `${String(end?.getHours()).padStart(2, "0")}:${String(end?.getMinutes()).padStart(2, "0")}`
      );

      // Set selected songs and collaborators if they exist in the current event
      if (currentSession.tracks) {
        setSelectedSongs(currentSession.tracks.map((track: SessionTrack) => ({
          value: track.id,
          label: track.display_name || "",
        })));
      } else {
        setSelectedSongs([]);
      }

      if (currentSession.collaborators) {
        setSelectedCollaborators(currentSession.collaborators.map((collaborator: SessionCollaborator) => ({
          id: collaborator.id,
          label: collaborator.artist_name || collaborator.legal_name || "",
          subtitle: collaborator.email || "",
        })));
      } else {
        setSelectedCollaborators([]);
      }
    } else if (initialStartDate && initialEndDate) {
      // Use the initial dates from drag selection
      setTitle("");
      setDescription("");
      setIsDescriptionModified(false);

      setStartDate(parseDate(initialStartDate.toISOString().split("T")[0]));
      setEndDate(parseDate(initialEndDate.toISOString().split("T")[0]));

      setStartTime(
        `${String(initialStartDate.getHours()).padStart(2, "0")}:${String(initialStartDate.getMinutes()).padStart(2, "0")}`
      );
      setEndTime(
        `${String(initialEndDate.getHours()).padStart(2, "0")}:${String(initialEndDate.getMinutes()).padStart(2, "0")}`
      );

      setSelectedSongs([]);
      setSelectedCollaborators([]);
    } else {
      // Default values for new event
      setTitle("");
      setDescription("");
      setIsDescriptionModified(false);
      setStartDate(today(getLocalTimeZone()));
      setEndDate(today(getLocalTimeZone()));
      setStartTime("09:00");
      setEndTime("10:00");
      setSelectedSongs([]);
      setSelectedCollaborators([]);
    }
  }, [currentSession, initialStartDate, initialEndDate, isModalOpen]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const start = new Date(
        startDate.year,
        startDate.month - 1,
        startDate.day,
        startHour,
        startMinute
      );

      const end = new Date(
        endDate.year,
        endDate.month - 1,
        endDate.day,
        endHour,
        endMinute
      );      

      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        toast.error("Authentication failed");
        return;
      }

      if (currentSession && currentSession.id) {
        // Update existing session
        await updateSession({
          token,
          sessionId: currentSession.id,
          updates: {
            title,
            description,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            track_ids: selectedSongs.map((song) => song.value),
            collaborator_ids: selectedCollaborators.map((collaborator) => collaborator.id),
          },
          onSuccess: () => {
            toast.success("Session updated successfully");
            closeModal();
            refreshSessions();
          },
          onError: (error) => {
            console.error("Failed to update session:", error);
            toast.error("Failed to update session");
          },
        });
      } else {
        // Create new session
        await createSession({
          token,
          data: {
            title,
            description,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            track_ids: selectedSongs.map((song) => song.value),
            collaborator_ids: selectedCollaborators.map((collaborator) => collaborator.id),
          },
          onSuccess: () => {
            toast.success("Session created successfully");
            closeModal();
            refreshSessions();
          },
          onError: (error) => {
            console.error("Failed to create session:", error);
            toast.error("Failed to create session");
          },
        });
      }
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("An error occurred while saving the session");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (currentSession && currentSession.id) {
      setIsDeleting(true);
      try {
        const token = await getToken({ template: "bard-backend" });
        if (!token) {
          toast.error("Authentication failed");
          return;
        }

        await deleteSession({
          token,
          sessionId: currentSession.id,
          onSuccess: () => {
            toast.success("Session deleted successfully");
            closeModal();
            refreshSessions();
          },
          onError: (error) => {
            console.error("Failed to delete session:", error);
            toast.error("Failed to delete session");
          },
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setIsDescriptionModified(true);
  };

  return (
    <Modal isOpen={isModalOpen} onOpenChange={closeModal} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {currentSession ? "Edit Session" : "Create Session"}
            </ModalHeader>
            <ModalBody>
              <Input
                label="Title"
                placeholder="Add title"
                value={title}
                onValueChange={setTitle}
                autoFocus
                isDisabled={isSaving || isDeleting}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <DatePicker
                    label="Start date"
                    value={startDate}
                    onChange={(value) => {
                      if (value) setStartDate(value);
                    }}
                    isDisabled={isSaving || isDeleting}
                  />
                </div>
                <div>
                  <Input
                    label="Start time"
                    type="time"
                    value={startTime}
                    onValueChange={setStartTime}
                    isDisabled={isSaving || isDeleting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <DatePicker
                    label="End date"
                    value={endDate}
                    onChange={(value) => {
                      if (value) setEndDate(value);
                    }}
                    isDisabled={isSaving || isDeleting}
                  />
                </div>
                <div>
                  <Input
                    label="End time"
                    type="time"
                    value={endTime}
                    onValueChange={setEndTime}
                    isDisabled={isSaving || isDeleting}
                  />
                </div>
              </div>

              {/* Songs multi-select */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Songs</label>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={() => setIsAddingSong(true)}
                    isDisabled={isSaving || isDeleting}
                  >
                    <Icon icon="lucide:plus" className="mr-1" width={16} />
                    Add New Song
                  </Button>
                  <SimpleNewSongModal
                    isOpen={isAddingSong}
                    onClose={() => setIsAddingSong(false)}
                    successCallback={(songId, songData) => {
                      setIsAddingSong(false);
                      refreshSessions();
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
                {sessionsLoading ? (
                  <div className="flex items-center gap-2 p-4">
                    <Spinner size="sm" />
                    <span>Loading songs...</span>
                  </div>
                ) : (
                  <>
                    <TrackMultiSelect
                      defaultSelected={selectedSongs}
                      setSelected={(value) => {
                        setSelectedSongs(value);
                      }}
                      title="Select Songs..."
                    />
                  </>
                )}
              </div>

              {/* Collaborators multi-select */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Collaborators</label>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    isDisabled={isSaving || isDeleting}
                    onPress={() => {
                      setIsAddingCollaborator(true);
                    }}
                  >
                    <Icon icon="lucide:plus" className="mr-1" width={16} />
                    Add New Collaborator
                  </Button>
                  <CollaboratorModal
                    isOpen={isAddingCollaborator}
                    onClose={() => {
                      setIsAddingCollaborator(false);
                    }}
                    successCallback={(collaboratorId, collaboratorData) => {
                      setIsAddingCollaborator(false);
                      refreshSessions();
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
                  ></CollaboratorModal>
                </div>
                {sessionsLoading ? (
                  <div className="flex items-center gap-2 p-4">
                    <Spinner size="sm" />
                    <span>Loading collaborators...</span>
                  </div>
                ) : (
                  <>
                    <CollaboratorMultiSelect
                      defaultSelected={selectedCollaborators}
                      setSelected={(value) => {
                        setSelectedCollaborators(value);
                      }}
                      title="Select collaborators..."
                    />
                  </>
                )}
              </div>

              {/* Description moved to the bottom */}
              <div className="mt-4">
                <Textarea
                  label="Description"
                  placeholder="Add description"
                  value={description}
                  onValueChange={handleDescriptionChange}
                  minRows={4}
                  isDisabled={isSaving || isDeleting}
                />
                {!isDescriptionModified &&
                  (selectedSongs.length > 0 ||
                    selectedCollaborators.length > 0) && (
                    <p className="text-xs text-default-500 mt-1">
                      Description auto-generated based on selected songs and
                      collaborators. Edit to customize.
                    </p>
                  )}
              </div>
            </ModalBody>
            <ModalFooter>
              {currentSession && (
                <Button
                  color="danger"
                  variant="light"
                  onPress={handleDelete}
                  isLoading={isDeleting}
                  isDisabled={isSaving}
                >
                  Delete
                </Button>
              )}
              <Button
                color="default"
                variant="light"
                onPress={onClose}
                isDisabled={isSaving || isDeleting}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSave}
                isLoading={isSaving}
                isDisabled={isDeleting}
              >
                {currentSession ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
