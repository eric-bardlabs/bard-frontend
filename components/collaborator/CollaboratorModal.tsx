import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { 
  Collaborator, 
  saveCollaborator, 
  updateCollaborator,
  updateCollaboratorRelationships 
} from "@/lib/api/collaborators";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
} from "@heroui/react";
import { CollaboratorMultiSelect } from "@/components/collaborator/collaboratorMultiSelect";
import { CollaboratorSelection } from "./types";
import { 
  CollaboratorBasicFields, 
  CollaboratorBasicData 
} from "./CollaboratorBasicFields";

interface CollaboratorModalProps {
  collaborator?: Collaborator;
  isOpen: boolean;
  onClose: () => void;
  successCallback?: (collaboratorId?: string, collaboratorData?: any) => void;
  showRelationshipSection?: boolean;
  creationSource?: string;
}

const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  isOpen,
  onClose,
  collaborator,
  successCallback,
  showRelationshipSection = true,
  creationSource,
}) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [collaboratorData, setCollaboratorData] = useState<CollaboratorBasicData>({
    legal_name: "",
    artist_name: "",
    email: "",
    region: "",
    pro: "",
    pro_id: "",
    profile_link: "",
    bio: "",
    phone_number: "",
  });

  const [selectedManagers, setSelectedManagers] = useState<CollaboratorSelection[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<CollaboratorSelection[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<CollaboratorSelection[]>([]);


  const resetForm = () => {
    setCollaboratorData({
      legal_name: "",
      artist_name: "",
      email: "",
      region: "",
      pro: "",
      pro_id: "",
      profile_link: "",
      bio: "",
      phone_number: "",
    });
    setSelectedManagers([]);
    setSelectedMembers([]);
    setSelectedEntities([]);
  };

  useEffect(() => {
    if (collaborator) {
      setCollaboratorData(collaborator);

      // Load existing relationships if available
      if (collaborator.relationships) {
        const managersOptions = collaborator.relationships.managers.map(m => ({
          id: m.id,
          label: m.artist_name || m.legal_name || "Unknown",
          subtitle: m.email,
        }));

        const membersOptions = collaborator.relationships.members.map(m => ({
          id: m.id,
          label: m.artist_name || m.legal_name || "Unknown",
          subtitle: m.email,
        }));

        const entitiesOptions = collaborator.relationships.publishing_entities.map(e => ({
          id: e.id,
          label: e.artist_name || e.legal_name || "Unknown",
          subtitle: e.email,
        }));

        setSelectedManagers(managersOptions);
        setSelectedMembers(membersOptions);
        setSelectedEntities(entitiesOptions);
      } else {
        setSelectedManagers([]);
        setSelectedMembers([]);
        setSelectedEntities([]);
      }
    } else {
      resetForm();
    }
  }, [collaborator, isOpen]);

  const handleCollaboratorDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCollaboratorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveCollaboratorMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const newCollaborator = await saveCollaborator({
        token,
        collaboratorData: {
          ...collaboratorData,
          initial_source: creationSource || "",
        },
      });

      // Save relationships if the section is shown and any are selected
      if (showRelationshipSection && (selectedManagers.length > 0 || selectedMembers.length > 0 || selectedEntities.length > 0)) {
        await updateCollaboratorRelationships({
          token,
          collaboratorId: newCollaborator.id,
          managers: selectedManagers.map(m => m.id),
          members: selectedMembers.map(m => m.id),
          publishing_entities: selectedEntities.map(e => e.id),
        });
      }

      return newCollaborator;
    },
    onSuccess: (data) => {
      toast.success("Collaborator added successfully");
      setIsSubmitting(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["myCollaborators"] });
      successCallback?.(data.id, data);
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to add collaborator");
      setIsSubmitting(false);
    },
  });

  const updateCollaboratorMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      if (!collaborator?.id) throw new Error("No collaborator ID");
      
      const updatedCollaborator = await updateCollaborator({
        token,
        id: collaborator.id,
        updates: collaboratorData,
      });

      // Update relationships if the section is shown
      if (showRelationshipSection) {
        await updateCollaboratorRelationships({
          token,
          collaboratorId: collaborator.id,
          managers: selectedManagers.map(m => m.id),
          members: selectedMembers.map(m => m.id),
          publishing_entities: selectedEntities.map(e => e.id),
        });
      }

      return updatedCollaborator;
    },
    onSuccess: (data) => {
      toast.success("Collaborator updated successfully");
      setIsSubmitting(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["myCollaborators"] });
      successCallback?.(data.id, data);
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update collaborator");
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);

    if (collaborator?.id) {
      updateCollaboratorMutation.mutate();
    } else {
      saveCollaboratorMutation.mutate();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="text-lg font-semibold">
                {collaborator ? "Edit" : "Add New"} Collaborator
              </div>
              <div className="text-sm text-default-500">
                {collaborator 
                  ? "Update collaborator information" 
                  : "Add a person or organization you work with"}
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <CollaboratorBasicFields
                  data={collaboratorData}
                  onChange={handleCollaboratorDataChange}
                />

                {/* Row 6 - Relationships */}
                {showRelationshipSection && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-md font-medium text-foreground-600">Relationships</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <CollaboratorMultiSelect
                          defaultSelected={selectedManagers}
                          setSelected={setSelectedManagers}
                          title="Managers"
                        />
                        <p className="text-xs text-default-500 mt-1">
                          Select people/entities who manage this collaborator
                        </p>
                      </div>

                      <div>
                        <CollaboratorMultiSelect
                          defaultSelected={selectedMembers}
                          setSelected={setSelectedMembers}
                          title="Members"
                        />
                        <p className="text-xs text-default-500 mt-1">
                          Select people who this collaborator manages
                        </p>
                      </div>

                      <div>
                        <CollaboratorMultiSelect
                          defaultSelected={selectedEntities}
                          setSelected={setSelectedEntities}
                          title="Publishing Entities"
                        />
                        <p className="text-xs text-default-500 mt-1">
                          Select publishing companies/entities associated with this collaborator
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="light" 
                onPress={handleClose}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={() => onSubmit()}
                isLoading={isSubmitting}
                isDisabled={!collaboratorData.artist_name && !collaboratorData.legal_name}
              >
                {collaborator ? "Update" : "Add"} Collaborator
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export { CollaboratorModal };