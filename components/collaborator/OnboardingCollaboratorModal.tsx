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
  onSubmit: (collaboratorData: {
    legal_name: string;
    artist_name: string;
    email: string;
    region: string;
    pro: string;
    pro_id: string;
    profile_link: string;
    bio: string;
    phone_number: string;
    initial_source?: string;
  }) => Promise<any>;
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
    legalName: "",
    artistName: "",
    email: "",
    region: "",
    pro: "",
    proId: "",
    profileLink: "",
    bio: "",
    phoneNumber: "",
  });
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();

  const resetForm = () => {
    setCollaboratorData({
      legalName: "",
      artistName: "",
      email: "",
      region: "",
      pro: "",
      proId: "",
      profileLink: "",
      bio: "",
      phoneNumber: "",
    });
    setPhoneNumber(undefined);
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
    if (!collaboratorData.artistName && !collaboratorData.legalName) {
      toast.error("Please provide either an artist name or legal name");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        legal_name: collaboratorData.legalName,
        artist_name: collaboratorData.artistName,
        email: collaboratorData.email,
        region: collaboratorData.region,
        pro: collaboratorData.pro,
        pro_id: collaboratorData.proId,
        profile_link: collaboratorData.profileLink,
        bio: collaboratorData.bio,
        phone_number: phoneNumber || "",
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

  const isFormValid = collaboratorData.artistName.trim() || collaboratorData.legalName.trim();

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
                phoneNumber={phoneNumber}
                onPhoneChange={setPhoneNumber}
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