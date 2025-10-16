"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
  User,
  Select,
  SelectItem,
} from "@heroui/react";
import { CollaboratorMultiSelect } from "./collaboratorMultiSelect";
import { CollaboratorSelection } from "./types";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Collaborator,
  ConflictField,
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
  const [conflicts, setConflicts] = useState<ConflictField[]>([]);
  const [resolvedConflicts, setResolvedConflicts] = useState<Record<string, string>>({});
  const [isDetectingConflicts, setIsDetectingConflicts] = useState(false);
  const [showConflictResolution, setShowConflictResolution] = useState(false);

  // Filter out target collaborator from available list
  const selectableCollaborators = availableCollaborators.filter(
    (collab) => collab.id !== targetCollaborator.id
  );

  const mergeMutation = useMutation({
    mutationFn: async ({ resolvedConflicts }: { resolvedConflicts?: Record<string, string> }) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      if (!targetCollaborator) throw new Error("No target collaborator");

      return mergeCollaborators({
        token,
        targetCollaboratorId: targetCollaborator.id,
        sourceCollaboratorIds: selectedCollaborators.map(c => c.id),
        resolvedConflicts,
      });
    },
    onSuccess: (data: MergeCollaboratorsResponse) => {
      if (data.success) {
        toast.success(
          `Successfully merged ${selectedCollaborators.length} collaborators. ` +
          `${data.affected_songs} songs and ${data.affected_sessions} sessions updated.`
        );
        queryClient.invalidateQueries({ queryKey: ["myCollaborators"] });
        onClose();
        resetState();
      } else if (data.conflicts) {
        setConflicts(data.conflicts);
        // Pre-select target collaborator's values
        const preSelectedResolutions: Record<string, string> = {};
        data.conflicts.forEach(conflict => {
          const targetValue = conflict.values.find(v => v.source_id === targetCollaborator.id);
          if (targetValue) {
            preSelectedResolutions[conflict.field_name] = targetValue.value || "";
          }
        });
        setResolvedConflicts(preSelectedResolutions);
        setShowConflictResolution(true);
        setIsDetectingConflicts(false);
      }
    },
    onError: (error: any) => {
      toast.error(`Merge failed: ${error.response?.data?.detail || error.message}`);
      setIsDetectingConflicts(false);
    },
  });

  const resetState = () => {
    setSelectedCollaborators([]);
    setConflicts([]);
    setResolvedConflicts({});
    setShowConflictResolution(false);
    setIsDetectingConflicts(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleDetectConflicts = () => {
    if (selectedCollaborators.length === 0) {
      toast.error("Please select at least one collaborator to merge");
      return;
    }

    setIsDetectingConflicts(true);
    mergeMutation.mutate({}); // Call without resolved conflicts to detect conflicts
  };

  const handlePerformMerge = () => {
    // Validate all conflicts are resolved
    const unresolvedConflicts = conflicts.filter(
      (conflict) => !resolvedConflicts[conflict.field_name]
    );

    if (unresolvedConflicts.length > 0) {
      toast.error("Please resolve all conflicts before proceeding");
      return;
    }

    mergeMutation.mutate({ resolvedConflicts });
  };

  const handleConflictResolution = (fieldName: string, value: string) => {
    setResolvedConflicts((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const getDisplayName = (collaborator?: Collaborator) => {
    return collaborator?.artist_name || collaborator?.legal_name || "Unknown";
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl" 
      scrollBehavior="inside"
      isDismissable={!mergeMutation.isPending}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-large">Merge Collaborators</h2>
          <p className="text-small text-default-500">
            Merge other collaborators into: <strong>{getDisplayName(targetCollaborator)}</strong>
          </p>
        </ModalHeader>

        <ModalBody>
          {!showConflictResolution ? (
            // Step 1: Select collaborators to merge
            <div className="space-y-4">
              <div className="mb-4">
                <p className="text-small text-default-500">
                  This will merge selected collaborators into one, including their splits, relationships, session attendance, etc.
                </p>
              </div>

              <div>
                <h3 className="text-medium font-semibold mb-2">Target Collaborator</h3>
                <Card>
                  <CardBody>
                    <User
                      name={getDisplayName(targetCollaborator)}
                      description={targetCollaborator.email}
                      avatarProps={{ radius: "sm" }}
                    />
                  </CardBody>
                </Card>
              </div>

              <div>
                <h3 className="text-medium font-semibold mb-2">
                  Select Collaborators to Merge Into Target
                </h3>
                <CollaboratorMultiSelect
                  defaultSelected={selectedCollaborators}
                  setSelected={setSelectedCollaborators}
                  title="Search and select collaborators to merge"
                  keepSearchOnSelect={true}
                />
              </div>

              {selectedCollaborators.length > 0 && (
                <div>
                  <h4 className="text-small font-medium mb-2">Selected for Merge:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCollaborators.map((collaborator) => (
                      <Chip key={collaborator.id} size="sm" variant="flat">
                        {collaborator.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Step 2: Resolve conflicts
            <div className="space-y-4">
              <div>
                <h3 className="text-medium font-semibold mb-2">Resolve Conflicts</h3>
                <p className="text-small text-default-500 mb-4">
                  The following fields have different values. Please choose which value to keep:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conflicts.map((conflict) => (
                  <Card key={conflict.field_name}>
                    <CardBody className="space-y-3">
                      <h4 className="text-small font-medium capitalize">
                        {conflict.field_name.replace(/_/g, " ")}
                      </h4>
                      <Select
                        size="sm"
                        label="Choose value to keep"
                        selectedKeys={[resolvedConflicts[conflict.field_name] || ""]}
                        onSelectionChange={(keys) => {
                          const selectedValue = Array.from(keys)[0] as string;
                          handleConflictResolution(conflict.field_name, selectedValue);
                        }}
                      >
                        {conflict.values.map((conflictValue) => (
                          <SelectItem 
                            key={conflictValue.value || ""} 
                            value={conflictValue.value || ""}
                            textValue={`${conflictValue.source_name}: ${conflictValue.value || "(empty)"}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{conflictValue.source_name}:</span>
                              <span className="text-default-600">
                                {conflictValue.value || "(empty)"}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={mergeMutation.isPending}>
            Cancel
          </Button>
          {!showConflictResolution ? (
            <Button
              color="primary"
              onPress={handleDetectConflicts}
              isLoading={isDetectingConflicts}
              isDisabled={selectedCollaborators.length === 0}
            >
              {isDetectingConflicts ? "Checking for Conflicts..." : "Next"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="light"
                onPress={() => setShowConflictResolution(false)}
                isDisabled={mergeMutation.isPending}
              >
                Back
              </Button>
              <Button
                color="danger"
                onPress={handlePerformMerge}
                isLoading={mergeMutation.isPending}
                isDisabled={
                  conflicts.some((conflict) => !resolvedConflicts[conflict.field_name])
                }
              >
                {mergeMutation.isPending ? "Merging..." : "Merge Collaborators"}
              </Button>
            </div>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};