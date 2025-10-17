"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { TrackMultiSelect, TrackOption } from "./track-multi-select";
import { Track, mergeTracks, PreviewTrackField, PreviewFieldValue, UpdateTrackData } from "@/lib/api/tracks";
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
        sxid: targetTrack.sxid,
        sync: targetTrack.sync,
        pitch: targetTrack.pitch,
        project_start_date: targetTrack.project_start_date,
        release_date: targetTrack.release_date,
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
            updatedPreviewData[field.field_name as keyof Track] = field.values[0].value as any;
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
          source_track_ids: selectedTracks.filter(t => t.value !== targetTrack.id).map(t => t.value),
          preview_only: false,
          final_track_data: finalTrackData,
        },
      });

      if (response.success) {
        toast.success(
          `Successfully merged ${selectedTracks.length} tracks. ${response.affected_collaborators} collaborators, ${response.affected_sessions} sessions, and ${response.affected_external_links} external links updated.`
        );
        
        setCurrentStep("confirmation");
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

  const renderPreviewStep = () => {
    // Separate fields into conflicts and non-conflicts with values
    const conflictFields = previewFields.filter(field => 
      field.has_conflict && field.values.some(v => v.value && v.value.trim() !== "")
    );
    
    const nonConflictFields = previewFields.filter(field => 
      !field.has_conflict && field.values.some(v => v.value && v.value.trim() !== "")
    );

    const formatFieldName = (fieldName: string) => {
      // Handle special cases for better display names
      if (fieldName === 'album_id') return 'Album';
      if (fieldName === 'artist_id') return 'Artist';
      
      return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
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
          <div className="space-y-6">
            {/* Conflicting Fields Section */}
            {conflictFields.length > 0 && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="lucide:alert-triangle" className="text-warning-600" />
                  <h4 className="text-medium font-semibold text-warning-800">
                    Conflicts to Resolve ({conflictFields.length})
                  </h4>
                </div>
                
                <div className="space-y-3">
                  {conflictFields.map((field) => (
                    <div key={field.field_name} className="space-y-2">
                      <label className="text-sm font-medium text-warning-800">
                        {formatFieldName(field.field_name)}
                      </label>
                      
                      <Select
                        selectedKeys={[previewData[field.field_name as keyof Track] as string || ""]}
                        onSelectionChange={(keys) => {
                          const selectedValue = Array.from(keys)[0] as string;
                          handlePreviewFieldChange(field.field_name, selectedValue);
                        }}
                        classNames={{
                          trigger: "border-warning-100 focus:border-warning-100",
                          value: "text-warning-800",
                        }}
                        placeholder="Select value..."
                        size="sm"
                        variant="bordered"
                        labelPlacement="outside"
                        className="w-full"
                      >
                        {field.values.map((fieldValue, index) => (
                          <SelectItem key={fieldValue.value}>
                            {fieldValue.display_value || "(empty)"}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Non-Conflicting Fields Section */}
            {nonConflictFields.length > 0 && (
              <div className="bg-content2 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="lucide:check-circle" className="text-success-600" />
                  <h4 className="text-medium font-semibold">
                    Merged Fields ({nonConflictFields.length})
                  </h4>
                </div>
                
                <div className="space-y-3">
                  {nonConflictFields.map((field) => (
                    <div key={field.field_name} className="space-y-2">
                      <label className="text-sm font-medium text-default-600">
                        {formatFieldName(field.field_name)}
                      </label>
                      
                      <input
                        type="text"
                        className="w-full p-2 border border-default-300 rounded-md bg-default-50 text-default-600"
                        value={field.values[0]?.display_value || ""}
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon icon="lucide:info" className="text-primary-600 text-sm mt-0.5 flex-shrink-0" />
                <div className="text-small text-primary-800">
                  <p className="font-medium mb-1">Merge Summary:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>{conflictFields.length} conflicts to resolve</li>
                    <li>{nonConflictFields.length} fields will be merged automatically</li>
                    <li>All collaborators, sessions, and external links will be consolidated</li>
                  </ul>
                </div>
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
            isDisabled={conflictFields.some(field => 
              !previewData[field.field_name as keyof Track] || 
              (previewData[field.field_name as keyof Track] as string) === ""
            )}
          >
            {isMerging ? "Merging..." : "Confirm Merge"}
          </Button>
        </ModalFooter>
      </>
    );
  };

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
              All data has been consolidated into "{previewData.display_name || targetTrack?.display_name || "Untitled"}"
            </p>
          </div>
          
          <p className="text-small text-default-600">
            You can now view the merged track with all combined data and collaborators.
          </p>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="light" onPress={handleModalClose}>
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

  const handleModalClose = () => {
    if (currentStep === "confirmation") {
      onMergeSuccess?.();
    }
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleModalClose} 
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