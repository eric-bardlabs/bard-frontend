"use client";

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
import { Collaborator } from "@/lib/api/collaborators";

interface DeleteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborator?: Collaborator;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteCollaboratorModal: React.FC<DeleteCollaboratorModalProps> = ({
  isOpen,
  onClose,
  collaborator,
  onConfirm,
  isDeleting = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isDismissable={!isDeleting}
      hideCloseButton={isDeleting}
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:alert-triangle" className="text-danger text-lg" />
                <h2 className="text-large">Delete Collaborator</h2>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete{" "}
                  <strong>
                    {collaborator?.artist_name || collaborator?.legal_name || "this collaborator"}
                  </strong>
                  ?
                </p>
                
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Icon icon="lucide:info" className="text-danger-600 text-sm mt-0.5 flex-shrink-0" />
                    <div className="text-small text-danger-800">
                      <p className="font-medium mb-1">This action will:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Permanently delete the collaborator profile</li>
                        <li>Remove them from all associated songs</li>
                        <li>Remove them from all associated sessions</li>
                        <li>This action cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onModalClose} isDisabled={isDeleting}>
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={() => {
                  onConfirm();
                  onModalClose();
                }}
                isLoading={isDeleting}
                isDisabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Collaborator"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};