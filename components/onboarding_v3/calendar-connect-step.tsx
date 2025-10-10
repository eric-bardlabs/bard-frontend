import React from "react";
import { 
  Button, 
  Tooltip, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter 
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { CalendarConnect } from "./identity-setup/calendar-connect";
import { OnboardingFormData } from "@/components/types/onboarding";

interface CalendarConnectStepProps {
  onboardingData: OnboardingFormData;
  onNext: () => void;
  onPrevious: () => void;
  saveOnboardingData: (data: OnboardingFormData) => void;
  isSaving?: boolean;
}

export const CalendarConnectStep: React.FC<CalendarConnectStepProps> = ({
  onboardingData,
  onNext,
  onPrevious,
  saveOnboardingData,
}) => {
  const [calendarPending, setCalendarPending] = React.useState(false);
  const [hasSelectedCalendar, setHasSelectedCalendar] = React.useState(false);
  const [selectedCalendarName, setSelectedCalendarName] = React.useState<string>("");
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [shouldTriggerImport, setShouldTriggerImport] = React.useState(false);

  const handleNext = () => {
    if (hasSelectedCalendar) {
      setShowImportModal(true);
    } else {
      onNext();
    }
  };

  const handleModalSkip = () => {
    setShowImportModal(false);
    onNext();
  };

  const handleModalClose = () => {
    setShowImportModal(false);
  };
  
  const handleModalImport = () => {
    setShowImportModal(false);
    setShouldTriggerImport(true);
  };
  
  const handleImportComplete = () => {
    setShouldTriggerImport(false);
    setHasSelectedCalendar(false);
  };

  const getTooltipContent = () => {
    if (calendarPending)
      return "We are extracting information from your calendar, this may take a few minutes...";
    return undefined;
  };

  const tooltipContent = getTooltipContent();

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-4 sm:p-6 space-y-6 flex-grow overflow-y-auto max-h-[calc(100vh-136px)]">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Calendar Integration</h2>
          </div>
        </div>

        <CalendarConnect
          onboardingData={onboardingData}
          onPendingStateChange={setCalendarPending}
          saveOnboardingData={saveOnboardingData}
          onCalendarSelectionChange={(hasSelection, calendarName) => {
            setHasSelectedCalendar(hasSelection);
            setSelectedCalendarName(calendarName || "");
          }}
          shouldTriggerImport={shouldTriggerImport}
          onImportComplete={handleImportComplete}
        />
      </div>

      <div className="sticky bottom-0 bg-background border-t p-4 sm:p-6">
        <div className="flex justify-between">
          <Button variant="flat" onPress={onPrevious} size="lg">
            Previous
          </Button>

          <Tooltip
            content={getTooltipContent()}
            placement="top"
            isDisabled={!tooltipContent}
          >
            <div className="inline-block">
              <Button
                isDisabled={
                  calendarPending
                }
                color="primary"
                onPress={handleNext}
                size="lg"
              >
                {calendarPending ? "Saving..." : "Next"}
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Import Confirmation Modal */}
      <Modal isOpen={showImportModal} onClose={handleModalClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="logos:google-icon" className="text-xl" />
              <span>Import from Google Calendar</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              You have selected a Google Calendar that hasn't been imported yet. 
              Would you like to import collaborator data from this calendar before continuing?
            </p>
            {selectedCalendarName && (
              <div className="mt-4 p-3 bg-default-50 rounded-lg">
                <p className="text-sm font-medium text-default-700">
                  Selected calendar:
                </p>
                <p className="text-sm text-default-600">{selectedCalendarName}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={handleModalSkip}
            >
              Skip Import
            </Button>
            <Button
              color="success"
              onPress={handleModalImport}
              startContent={<Icon icon="lucide:share-2" />}
            >
              Import Calendar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}; 