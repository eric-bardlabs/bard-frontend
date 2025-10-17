import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface DeleteTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  trackName: string;
  isDeleting?: boolean;
}

export const DeleteTrackModal: React.FC<DeleteTrackModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  trackName,
  isDeleting = false,
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="md"
      isDismissable={!isDeleting}
      hideCloseButton={isDeleting}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:alert-triangle" className="text-warning text-lg" />
            <span>Delete Track</span>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-3">
            <p className="text-foreground">
              Are you sure you want to delete <span className="font-semibold">"{trackName}"</span>?
            </p>
            
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon icon="lucide:info" className="text-warning-600 text-sm mt-0.5 flex-shrink-0" />
                <div className="text-small text-warning-800">
                  <p className="font-medium mb-1">This action will:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Permanently delete the track</li>
                    <li>Remove all collaborator associations</li>
                    <li>Remove the track from all your sessions</li>
                    <li>Delete all external links for this track</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <p className="text-small text-danger font-medium">
              This action cannot be undone.
            </p>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button 
            variant="light" 
            onPress={onClose}
            isDisabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            color="danger" 
            onPress={onConfirm}
            isLoading={isDeleting}
            startContent={!isDeleting ? <Icon icon="lucide:trash" className="text-sm" /> : undefined}
          >
            {isDeleting ? "Deleting..." : "Delete Track"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};