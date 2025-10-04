import React from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  Progress
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface CatalogInputModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const CatalogInputModal: React.FC<CatalogInputModalProps> = ({ 
  isOpen, 
  onOpenChange 
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="md"
      isDismissable={false}
      hideCloseButton
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-medium">
                    <Icon icon="lucide:database" className="text-primary text-xl" />
                  </div>
                  <h2 className="text-xl font-semibold">Catalog Input</h2>
                </div>
                <div className="text-sm text-default-500">Step 2 of 4</div>
              </div>
              <Progress 
                value={50} 
                color="primary" 
                size="sm" 
                className="mt-2"
                aria-label="Onboarding progress"
              />
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-default-700">
                  We'll import your songs, contacts, sessions, and metadata from Spotify, your calendar, and spreadsheets.
                </p>
                <p className="text-default-700">
                  The more we pull in, the less you'll need to add—though you can always update later.
                </p>
                
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="flex flex-col items-center p-3 border border-default-200 rounded-medium bg-content1 hover:bg-content2 transition-colors">
                    <Icon icon="logos:spotify" className="text-3xl mb-2" />
                    <span className="text-xs text-center">Spotify</span>
                  </div>
                  <div className="flex flex-col items-center p-3 border border-default-200 rounded-medium bg-content1 hover:bg-content2 transition-colors">
                    <Icon icon="lucide:calendar" className="text-3xl mb-2 text-default-500" />
                    <span className="text-xs text-center">Calendar</span>
                  </div>
                  <div className="flex flex-col items-center p-3 border border-default-200 rounded-medium bg-content1 hover:bg-content2 transition-colors">
                    <Icon icon="lucide:file-spreadsheet" className="text-3xl mb-2 text-default-500" />
                    <span className="text-xs text-center">Spreadsheets</span>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                color="primary" 
                onPress={onClose}
                endContent={<Icon icon="lucide:arrow-right" />}
              >
                Continue
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}