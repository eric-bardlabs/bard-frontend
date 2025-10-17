"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { TrackMultiSelect, TrackOption } from "./track-multi-select";
import { Track, mergeTracks, PreviewTrackField, UpdateTrackData } from "@/lib/api/tracks";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface MergeSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTrack?: Track;
  onMergeSuccess?: () => void;
}

type MergeStep = "selection" | "preview" | "confirmation";

export const MergeSongsModal: React.FC<MergeSongsModalProps> = ({
  isOpen,
  onClose,
  targetTrack,
  onMergeSuccess,
}) => {
  const { getToken } = useAuth();
  const router = useRouter();

  // State - must be before any early returns
  const [currentStep, setCurrentStep] = useState<MergeStep>("selection");
  const [selectedTracks, setSelectedTracks] = useState<TrackOption[]>([]);
  const [previewFields, setPreviewFields] = useState<PreviewTrackField[]>([]);
  const [previewData, setPreviewData] = useState<Partial<Track>>({});
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  // Initialize preview data from target track
  useEffect(() => {
    if (targetTrack) {
      setPreviewData({
        display_name: targetTrack.display_name,
        artist_id: targetTrack.artist_id,
        album_id: targetTrack.album_id,
        status: targetTrack.status,
        isrc: targetTrack.isrc,
        spotify_code: targetTrack.spotify_code,
        apple_code: targetTrack.apple_code,
        sxid: targetTrack.sxid,
        ean: targetTrack.ean,
        upc: targetTrack.upc,
        sync: targetTrack.sync,
        pitch: targetTrack.pitch,
        project_start_date: targetTrack.project_start_date,
        release_date: targetTrack.release_date,
        spotify_track_id: targetTrack.spotify_track_id,
        splits_confirmation_status: targetTrack.splits_confirmation_status,
        registration_status: targetTrack.registration_status,
        master_fee_status: targetTrack.master_fee_status,
        notes: targetTrack.notes,
      });
    }
  }, [targetTrack]);

  const resetState = () => {
    setCurrentStep("selection");
    setSelectedTracks([]);
    setPreviewFields([]);
    setPreviewData({});
    setIsGeneratingPreview(false);
    setIsMerging(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  // Generate preview of conflicting fields
  const handleGeneratePreview = async () => {
    if (selectedTracks.length === 0 || !targetTrack) {
      toast.error("Please select at least one track to merge");
      return;
    }

    setIsGeneratingPreview(true);
    
    try {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      const response = await mergeTracks({
        token,
        request: {
          target_track_id: targetTrack.id,
          source_track_ids: selectedTracks.filter(t => t.value !== targetTrack.id).map(t => t.value),
          preview_only: true,
        },
      });

      if (response.success && response.preview_fields) {
        setPreviewFields(response.preview_fields);
        
        // Initialize preview data with target track defaults and first conflict values
        const updatedPreviewData = { ...previewData };
        response.preview_fields.forEach(field => {
          if (field.has_conflict && field.values.length > 0) {
            // Pre-select the target track's value (first value should be from target)
            updatedPreviewData[field.field_name as keyof Track] = field.values[0] as any;
          }
        });
        setPreviewData(updatedPreviewData);
        
        setCurrentStep("preview");
      }
    } catch (error: any) {
      console.error("Failed to generate preview:", error);
      toast.error(`Failed to generate preview: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Handle field value change in preview
  const handlePreviewFieldChange = (fieldName: string, value: string) => {
    setPreviewData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Perform final merge
  const handleConfirmMerge = async () => {
    setIsMerging(true);
    
    if (!targetTrack) {
      toast.error("No target track selected");
      setIsMerging(false);
      return;
    }
    try {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      // Prepare final track data from preview data
      const finalTrackData: UpdateTrackData = {};
      
      // Only include fields that have been modified or have conflicts
      previewFields.forEach(field => {
        if (field.has_conflict) {
          const value = previewData[field.field_name as keyof Track];
          if (value !== undefined && value !== null) {
            (finalTrackData as any)[field.field_name] = value;
          }
        }
      });

      const response = await mergeTracks({
        token,
        request: {
          target_track_id: targetTrack.id,
          source_track_ids: selectedTracks.map(t => t.value),
          preview_only: false,
          final_track_data: finalTrackData,
        },
      });

      if (response.success) {
        toast.success(
          `Successfully merged ${selectedTracks.length} tracks. ${response.affected_collaborators} collaborators, ${response.affected_sessions} sessions, and ${response.affected_external_links} external links updated.`
        );
        
        setCurrentStep("confirmation");
        onMergeSuccess?.();
      }
    } catch (error: any) {
      console.error("Failed to merge tracks:", error);
      toast.error(`Failed to merge tracks: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsMerging(false);
    }
  };

  const handleGoToTrack = () => {
    if (!targetTrack) {
      router.push("/songs");
      onClose();
      return;
    }
    router.push(`/songs/${targetTrack.id}`);
    onClose();
  };

  const renderSelectionStep = () => (
    <>
      <ModalHeader>
        <div className="flex flex-col gap-1">
          <h2 className="text-large">Merge Tracks</h2>
          <p className="text-small text-default-500">
            Select tracks to merge into <span className="font-semibold text-primary">
              "{targetTrack?.display_name || "Untitled"}"
            </span>
          </p>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          <TrackMultiSelect
            defaultSelected={selectedTracks}
            setSelected={(tracks) => {
              setSelectedTracks(tracks);
            }}
            title="Search and select tracks to merge"
          />
          
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Icon icon="lucide:info" className="text-warning-600 text-sm mt-0.5 flex-shrink-0" />
              <div className="text-small text-warning-800">
                <p className="font-medium mb-1">This will merge selected tracks into one, including:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>All collaborator associations and splits</li>
                  <li>Session relationships</li>
                  <li>External links and metadata</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="light" onPress={onClose}>
          Cancel
        </Button>
        <Button
          color="primary"
          onPress={handleGeneratePreview}
          isLoading={isGeneratingPreview}
          isDisabled={selectedTracks.length === 0}
        >
          {isGeneratingPreview ? "Generating Preview..." : "Preview Merge"}
        </Button>
      </ModalFooter>
    </>
  );

  const renderPreviewStep = () => (
    <>
      <ModalHeader>
        <div className="flex flex-col gap-1">
          <h2 className="text-large">Review Merge</h2>
          <p className="text-small text-default-500">
            Review and resolve conflicts for the merged track
          </p>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          <div className="bg-content2 rounded-lg p-4">
            <h4 className="text-medium font-semibold mb-3">Merged Track Details</h4>
            
            <div className="space-y-3">
              {previewFields.map((field) => (
                <div key={field.field_name} className="space-y-2">
                  <label className="text-sm font-medium">
                    {field.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {field.has_conflict && (
                      <span className="text-warning ml-2">⚠️ Conflict detected</span>
                    )}
                  </label>
                  
                  {field.has_conflict ? (
                    <select
                      className="w-full p-2 border border-default-300 rounded-md"
                      value={previewData[field.field_name as keyof Track] as string || ""}
                      onChange={(e) => handlePreviewFieldChange(field.field_name, e.target.value)}
                    >
                      {field.values.map((value, index) => (
                        <option key={index} value={value}>
                          {value || "(empty)"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full p-2 border border-default-300 rounded-md bg-default-100"
                      value={field.values[0] || ""}
                      readOnly
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="light" onPress={() => setCurrentStep("selection")}>
          Back
        </Button>
        <Button
          color="danger"
          onPress={handleConfirmMerge}
          isLoading={isMerging}
        >
          {isMerging ? "Merging..." : "Confirm Merge"}
        </Button>
      </ModalFooter>
    </>
  );

  const renderConfirmationStep = () => (
    <>
      <ModalHeader>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:check-circle" className="text-success text-lg" />
            <h2 className="text-large">Merge Complete</h2>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="text-center space-y-4">
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <Icon icon="lucide:music" className="text-success-600 text-3xl mx-auto mb-2" />
            <p className="text-success-800 font-medium">
              Successfully merged {selectedTracks.length} tracks
            </p>
            <p className="text-success-700 text-sm mt-1">
              All data has been consolidated into "{targetTrack?.display_name || "Untitled"}"
            </p>
          </div>
          
          <p className="text-small text-default-600">
            You can now view the merged track with all combined data and collaborators.
          </p>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="light" onPress={onClose}>
          Close
        </Button>
        <Button color="primary" onPress={handleGoToTrack}>
          <Icon icon="lucide:external-link" className="text-sm" />
          Go to Track
        </Button>
      </ModalFooter>
    </>
  );

  // Don't render modal content if no target track
  if (!targetTrack) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalBody>
            <p>No track selected for merging.</p>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl" 
      scrollBehavior="inside"
      isDismissable={!isMerging}
      hideCloseButton={isMerging}
    >
      <ModalContent>
        {currentStep === "selection" && renderSelectionStep()}
        {currentStep === "preview" && renderPreviewStep()}
        {currentStep === "confirmation" && renderConfirmationStep()}
      </ModalContent>
    </Modal>
  );
};