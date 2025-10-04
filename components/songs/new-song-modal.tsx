"use client";

import React from "react";
import {
  Button,
  Form,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "@clerk/nextjs";
import { createTrack } from "@/lib/api/tracks";

import { SplitInformationStep } from "./split-information-step";
import { useSplitsState } from "@/hooks/useSplitsState";
import { CollaboratorSelection } from "@/components/collaborator/types";
import SongBasicInfoForm from "./song-basic-info-form";
import { AlbumOption } from "../album/AlbumSingleSelect";

type SongFormStep = 1 | 2;

interface NewSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  successCallback?: () => void;
}

const NewSongModal: React.FC<NewSongModalProps> = ({
  isOpen,
  onClose,
  successCallback,
}) => {
  const [currentSongStep, setCurrentSongStep] = React.useState<SongFormStep>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { getToken } = useAuth();

  // Song form state - Step 1
  const [songFormData, setSongFormData] = React.useState({
    title: "",
    status: "",
    pitch: "",
    notes: "",
    isrc: "",
    upc: "",
    sixd: "",
  });

  // Album state for AlbumSingleSelect
  const [selectedAlbum, setSelectedAlbum] = React.useState<AlbumOption | null>(null);
  // Artist and collaborator state for the new components
  const [selectedArtist, setSelectedArtist] = React.useState<CollaboratorSelection | null>(null);
  const [selectedCollaborators, setSelectedCollaborators] = React.useState<CollaboratorSelection[]>([]);

  // Song form state - Step 2
  const [songwriterSplits, setSongwriterSplits] = React.useState<
    Record<string, number>
  >({});
  const [publishingSplits, setPublishingSplits] = React.useState<
    Record<string, number>
  >({});
  const [masterSplits, setMasterSplits] = React.useState<
    Record<string, number>
  >({});
  const [fee, setFee] = React.useState<string | undefined>(undefined);
  const [registrationStatus, setRegistrationStatus] = React.useState("");
  const [masterFeeStatus, setMasterFeeStatus] = React.useState("");

  // Collaborator selections for each split type
  const [songwriterCollaborators, setSongwriterCollaborators] = React.useState<
    Set<string>
  >(new Set([]));
  const [publishingCollaborators, setPublishingCollaborators] = React.useState<
    Set<string>
  >(new Set([]));
  const [masterCollaborators, setMasterCollaborators] = React.useState<
    Set<string>
  >(new Set([]));

  // Use current date for initial date values
  const [songProjectStartDate, setSongProjectStartDate] =
    React.useState<any>(null);
  const [songReleaseDate, setSongReleaseDate] = React.useState<any>(null);

  // Initialize splits state
  const {
    splitRows,
    totals,
    handleSplitRowChange,
    addSplitRow,
    removeSplitRow,
    resetSplits,
  } = useSplitsState([{ id: "", collaboratorName: "", collaboratorEmail: "", songwriting: "", publishing: "", master: "" }]);


  const handleSongFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSongFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSongSelectChange = (name: string, value: string) => {
    setSongFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetSongForm = () => {
    setSongFormData({
      title: "",
      status: "",
      pitch: "",
      notes: "",
      isrc: "",
      upc: "",
      sixd: "",
    });
    setSelectedAlbum(null);
    setSelectedArtist(null);
    setSelectedCollaborators([]);
    setSongwriterSplits({});
    setPublishingSplits({});
    setMasterSplits({});
    setSongwriterCollaborators(new Set([]));
    setPublishingCollaborators(new Set([]));
    setMasterCollaborators(new Set([]));
    setFee(undefined);
    setRegistrationStatus("");
    setMasterFeeStatus("");
    setSongProjectStartDate(null);
    setSongReleaseDate(null);
    setCurrentSongStep(1);
    setIsSubmitting(false);
    // Reset splits state
    resetSplits([{ id: "", collaboratorName: "", collaboratorEmail: "", songwriting: "", publishing: "", master: "" }]);
  };

  const handleNextStep = () => {
    // Get all selected collaborator IDs (including artist)
    const allCollaboratorIds = new Set([
      ...selectedCollaborators.map(c => c.id),
      ...(selectedArtist ? [selectedArtist.id] : [])
    ]);

    // Initialize collaborator sets for each split type
    setSongwriterCollaborators(allCollaboratorIds);
    setPublishingCollaborators(allCollaboratorIds);
    setMasterCollaborators(allCollaboratorIds);

    // Initialize empty splits (no auto-balancing)
    setSongwriterSplits({});
    setPublishingSplits({});
    setMasterSplits({});

    // Initialize splits table with all selected collaborators and artist
    const initialSplitRows = Array.from(allCollaboratorIds).map(collabId => {
      // Check if this is the selected artist
      if (selectedArtist && selectedArtist.id === collabId) {
        return {
          id: collabId,
          collaboratorName: selectedArtist.label,
          collaboratorEmail: selectedArtist.subtitle || "",
          songwriting: "",
          publishing: "",
          master: "",
        };
      }
      
      // Otherwise find in collaborator options
      const collaboratorOption = selectedCollaborators.find(c => c.id === collabId);
      return {
        id: collabId,
        collaboratorName: collaboratorOption?.label || "",
        collaboratorEmail: collaboratorOption?.subtitle || "",
        songwriting: "",
        publishing: "",
        master: "",
      };
    });

    // If no collaborators selected, start with one empty row
    if (initialSplitRows.length === 0) {
      initialSplitRows.push({ id: "", collaboratorName: "", collaboratorEmail: "", songwriting: "", publishing: "", master: "" });
    }

    resetSplits(initialSplitRows);
    setCurrentSongStep(2);
  };

  const handlePrevStep = () => {
    setCurrentSongStep(1);
  };

  const handleCreateSong = async () => {
    setIsSubmitting(true);

    try {
      const token = await getToken({ template: "bard-backend" });

      // Prepare collaborators with splits from splitRows
      const collaboratorsData = splitRows
        .filter(row => row.id && row.collaboratorName) // Only include rows with selected collaborators
        .map(row => ({
          id: row.id,
          songwriting_split: parseFloat(row.songwriting?.toString() || "0") || 0,
          publishing_split: parseFloat(row.publishing?.toString() || "0") || 0,
          master_split: parseFloat(row.master?.toString() || "0") || 0,
        }));

      // Format dates
      const formatDate = (date: any) => {
        if (!date) return undefined;
        const d = new Date(date);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      await createTrack({
        token: token as string,
        data: {
          display_name: songFormData.title,
          album_id: selectedAlbum?.id || undefined,
          artist_id: selectedArtist?.id || undefined,
          status: songFormData.status,
          isrc: songFormData.isrc || undefined,
          upc: songFormData.upc || undefined,
          sixid: songFormData.sixd || undefined,
          release_date: formatDate(songReleaseDate),
          project_start_date: formatDate(songProjectStartDate),
          pitch: songFormData.pitch || undefined,
          notes: songFormData.notes || undefined,
          registration_status: registrationStatus || undefined,
          master_fee_status: masterFeeStatus || undefined,
          master_fee_amount: fee ? parseFloat(fee) : undefined,
          collaborators: collaboratorsData,
        },
        onSuccess: () => {
          resetSongForm();
          successCallback?.();
          onClose();
        },
        onError: (error) => {
          console.error("Failed to create song:", error);
          // In a real app, you would show an error message to the user
        },
      });
    } catch (error) {
      console.error("Failed to create song:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This function is only used to prevent the default form submission
    // The actual submission is handled by the buttons' onPress handlers
  };

  const isStep1Valid = () => {
    return songFormData.title.trim() !== "";
  };

  const isReleaseStatus = songFormData.status === "Release";

  // Handle adding/removing collaborators from specific split types
  const handleCollaboratorToggle = (
    collaboratorId: string,
    splitType: "songwriter" | "publishing" | "master",
    isAdding: boolean
  ) => {
    let updatedCollaborators: Set<string>;
    let updatedSplits: Record<string, number>;

    switch (splitType) {
      case "songwriter":
        updatedCollaborators = new Set(songwriterCollaborators);
        if (isAdding) {
          updatedCollaborators.add(collaboratorId);
        } else {
          updatedCollaborators.delete(collaboratorId);
        }
        setSongwriterCollaborators(updatedCollaborators);

        // Update splits
        updatedSplits = { ...songwriterSplits };
        if (!isAdding) {
          // Remove from splits
          delete updatedSplits[collaboratorId];
        }
        setSongwriterSplits(updatedSplits);
        break;

      case "publishing":
        updatedCollaborators = new Set(publishingCollaborators);
        if (isAdding) {
          updatedCollaborators.add(collaboratorId);
        } else {
          updatedCollaborators.delete(collaboratorId);
        }
        setPublishingCollaborators(updatedCollaborators);

        // Update splits
        updatedSplits = { ...publishingSplits };
        if (!isAdding) {
          // Remove from splits
          delete updatedSplits[collaboratorId];
        }
        setPublishingSplits(updatedSplits);
        break;

      case "master":
        updatedCollaborators = new Set(masterCollaborators);
        if (isAdding) {
          updatedCollaborators.add(collaboratorId);
        } else {
          updatedCollaborators.delete(collaboratorId);
        }
        setMasterCollaborators(updatedCollaborators);

        // Update splits
        updatedSplits = { ...masterSplits };
        if (!isAdding) {
          // Remove from splits
          delete updatedSplits[collaboratorId];
        }
        setMasterSplits(updatedSplits);
        break;
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      resetSongForm();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon
              icon="lucide:music"
              className="text-primary"
              width={24}
              height={24}
            />
            <span>Create New Song</span>
          </div>
          <p className="text-sm text-default-500">
            {currentSongStep === 1 ? "Basic Information" : "Splits, Registration, and Fees"}
          </p>
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={handleFormSubmit} className="space-y-6 w-full">
            {currentSongStep === 1 ? (
              <SongBasicInfoForm
                songFormData={songFormData}
                handleSongFormChange={handleSongFormChange}
                handleSongSelectChange={handleSongSelectChange}
                songProjectStartDate={songProjectStartDate}
                setSongProjectStartDate={setSongProjectStartDate}
                songReleaseDate={songReleaseDate}
                setSongReleaseDate={setSongReleaseDate}
                isReleaseStatus={isReleaseStatus}
                // New props for the single select components
                selectedAlbum={selectedAlbum}
                setSelectedAlbum={setSelectedAlbum}
                selectedArtist={selectedArtist}
                setSelectedArtist={setSelectedArtist}
                selectedCollaborators={selectedCollaborators}
                setSelectedCollaborators={setSelectedCollaborators}
              />
            ) : (
              <SplitInformationStep
                handleCollaboratorToggle={handleCollaboratorToggle}
                registrationStatus={registrationStatus}
                setRegistrationStatus={setRegistrationStatus}
                masterFeeStatus={masterFeeStatus}
                setMasterFeeStatus={setMasterFeeStatus}
                fee={fee}
                setFee={setFee}
                // Pass splits state from parent
                splitRows={splitRows}
                onSplitRowChange={handleSplitRowChange}
                onAddRow={addSplitRow}
                onRemoveRow={removeSplitRow}
                splitsTotal={totals}
              />
            )}
          </Form>
        </ModalBody>
        <ModalFooter>
          {currentSongStep === 1 ? (
            <>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleNextStep}
                isDisabled={!isStep1Valid()}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="flat" onPress={handlePrevStep}>
                Back
              </Button>
              <Button
                color="primary"
                onPress={handleCreateSong}
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
              >
                Create Song
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};


export default NewSongModal;
