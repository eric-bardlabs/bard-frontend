import React, { useState } from "react";
import { toast } from "sonner";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
} from "@heroui/react";
import { 
  CollaboratorBasicFields, 
  CollaboratorBasicData 
} from "./CollaboratorBasicFields";

interface OnboardingCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (collaboratorData: CollaboratorBasicData) => Promise<any>;
  creationSource?: string;
}

export const OnboardingCollaboratorModal: React.FC<OnboardingCollaboratorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  creationSource = "onboarding",
}) => {
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
  };

  const handleCollaboratorDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCollaboratorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    
    // Basic validation
    if (!collaboratorData.artist_name && !collaboratorData.legal_name) {
      toast.error("Please provide either an artist name or legal name");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...collaboratorData,
        initial_source: creationSource,
      });

      toast.success("Collaborator added successfully");
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating collaborator:", error);
      toast.error("Failed to add collaborator");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isFormValid = collaboratorData.artist_name?.trim() || collaboratorData.legal_name?.trim();

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
                Add New Collaborator
              </div>
              <div className="text-sm text-default-500">
                Add a person or organization you work with
              </div>
            </ModalHeader>
            <ModalBody>
              <CollaboratorBasicFields
                data={collaboratorData}
                onChange={handleCollaboratorDataChange}
              />
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
                onPress={handleSubmit}
                isLoading={isSubmitting}
                isDisabled={!isFormValid}
              >
                Add Collaborator
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};