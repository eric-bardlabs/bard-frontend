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
import { CollaboratorMultiSelect } from "./collaboratorMultiSelect";
import { CollaboratorSelection } from "./types";
import { MergePreviewStep } from "./MergePreviewStep";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Collaborator,
  CollaboratorRelationships,
  PreviewField,
  mergeCollaborators,
  MergeCollaboratorsResponse,
} from "@/lib/api/collaborators";

interface MergeCollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCollaborator?: Collaborator;
  availableCollaborators: Collaborator[];
}

export const MergeCollaboratorsModal: React.FC<MergeCollaboratorsModalProps> = ({
  isOpen,
  onClose,
  targetCollaborator,
  availableCollaborators,
}) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Don't render if no target collaborator
  if (!targetCollaborator) {
    return null;
  }

  // State
  const [selectedCollaborators, setSelectedCollaborators] = useState<CollaboratorSelection[]>([]);
  const [previewFields, setPreviewFields] = useState<PreviewField[]>([]);
  const [previewRelationships, setPreviewRelationships] = useState<CollaboratorRelationships | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const previewMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      if (!targetCollaborator) throw new Error("No target collaborator");

      return mergeCollaborators({
        token,
        targetCollaboratorId: targetCollaborator.id,
        sourceCollaboratorIds: selectedCollaborators.filter(c => c.id !== targetCollaborator.id).map(c => c.id),
        previewOnly: true,
      });
    },
    onSuccess: (data: MergeCollaboratorsResponse) => {
      if (data.success && data.preview_fields && data.preview_relationships) {
        setPreviewFields(data.preview_fields);
        setPreviewRelationships(data.preview_relationships);
        
        // Pre-select target collaborator's values for conflicting fields
        const preSelectedValues: Record<string, string> = {};
        data.preview_fields.forEach(field => {
          if (field.has_conflict) {
            const targetValue = field.values.find(v => v.source_id === targetCollaborator.id);
            if (targetValue) {
              preSelectedValues[field.field_name] = targetValue.value || "";
            }
          }
        });
        setFieldValues(preSelectedValues);
        setShowPreview(true);
        setIsGeneratingPreview(false);
      }
    },
    onError: (error: any) => {
      toast.error(`Preview failed: ${error.response?.data?.detail || error.message}`);
      setIsGeneratingPreview(false);
    },
  });

  const finalMergeMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      if (!targetCollaborator) throw new Error("No target collaborator");

      return mergeCollaborators({
        token,
        targetCollaboratorId: targetCollaborator.id,
        sourceCollaboratorIds: selectedCollaborators.filter(c => c.id !== targetCollaborator.id).map(c => c.id),
        resolvedConflicts: fieldValues,
        previewOnly: false,
      });
    },
    onSuccess: (data: MergeCollaboratorsResponse) => {
      if (data.success) {
        toast.success(
          `Successfully merged ${selectedCollaborators.filter(c => c.id !== targetCollaborator.id).length} collaborators. ` +
          `${data.affected_songs} songs and ${data.affected_sessions} sessions updated.`
        );
        queryClient.invalidateQueries({ queryKey: ["myCollaborators"] });
        onClose();
        resetState();
      }
    },
    onError: (error: any) => {
      toast.error(`Merge failed: ${error.response?.data?.detail || error.message}`);
    },
  });

  const resetState = () => {
    setSelectedCollaborators([]);
    setPreviewFields([]);
    setPreviewRelationships(null);
    setFieldValues({});
    setShowPreview(false);
    setIsGeneratingPreview(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleGeneratePreview = () => {
    const sourceCollaborators = selectedCollaborators.filter(c => c.id !== targetCollaborator.id);
    if (sourceCollaborators.length === 0) {
      toast.error("Please select at least one collaborator to merge");
      return;
    }

    setIsGeneratingPreview(true);
    previewMutation.mutate();
  };

  const handleConfirmMerge = () => {
    // Validate all conflicts are resolved
    const conflictingFields = previewFields.filter(field => field.has_conflict);
    const unresolvedConflicts = conflictingFields.filter(
      (field) => !fieldValues[field.field_name]
    );

    if (unresolvedConflicts.length > 0) {
      toast.error("Please resolve all conflicts before proceeding");
      return;
    }

    finalMergeMutation.mutate();
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl" 
      scrollBehavior="inside"
      isDismissable={!finalMergeMutation.isPending}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-large">Merge Collaborators</h2>
        </ModalHeader>

        <ModalBody>
          {!showPreview ? (
            // Step 1: Select collaborators to merge
            <div className="space-y-4">
              <div className="mb-4">
                <p className="text-medium">
                  Select collaborators to merge with <span className="font-semibold text-primary">{targetCollaborator.artist_name || targetCollaborator.legal_name || "Unknown"}</span>
                </p>
              </div>

              <div>
                <CollaboratorMultiSelect
                  defaultSelected={selectedCollaborators}
                  setSelected={setSelectedCollaborators}
                  title="Search and select collaborators to merge"
                  keepSearchOnSelect={true}
                />
              </div>

              <div>
                <p className="text-small text-default-500">
                  This will merge selected collaborators into one, including their splits, relationships, session attendance, etc.
                </p>
              </div>
            </div>
          ) : (
            // Step 2: Preview merged collaborator
            <MergePreviewStep
              previewFields={previewFields}
              previewRelationships={previewRelationships}
              resolvedConflicts={fieldValues}
              onConflictResolution={handleFieldChange}
              onFieldChange={handleFieldChange}
            />
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={previewMutation.isPending || finalMergeMutation.isPending}>
            Cancel
          </Button>
          {!showPreview ? (
            <Button
              color="primary"
              onPress={handleGeneratePreview}
              isLoading={isGeneratingPreview}
              isDisabled={selectedCollaborators.filter(c => c.id !== targetCollaborator.id).length === 0}
            >
              {isGeneratingPreview ? "Generating Preview..." : "Preview Merge"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="light"
                onPress={() => setShowPreview(false)}
                isDisabled={finalMergeMutation.isPending}
              >
                Back
              </Button>
              <Button
                color="danger"
                onPress={handleConfirmMerge}
                isLoading={finalMergeMutation.isPending}
                isDisabled={
                  previewFields.filter(field => field.has_conflict).some((field) => !fieldValues[field.field_name])
                }
              >
                {finalMergeMutation.isPending ? "Merging..." : "Confirm Merge"}
              </Button>
            </div>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};