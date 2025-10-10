import React from "react";
import { Button, Tooltip } from "@heroui/react";
import FileUpload from "./file-upload";
import { OnboardingFormData } from "@/components/types/onboarding";

interface FileUploadStepProps {
  onboardingData: OnboardingFormData;
  saveOnboardingData: (data: OnboardingFormData) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const FileUploadStep: React.FC<FileUploadStepProps> = ({
  onboardingData,
  saveOnboardingData,
  onNext,
  onPrevious,
}) => {
  const [fileUploadPending, setFileUploadPending] = React.useState(false);

  const handleNext = () => {    
      onNext();
  };

  const getTooltipContent = () => {
    if (fileUploadPending)
      return "We are processing your CSV, this may take a few minutes...";
    return undefined;
  };

  const tooltipContent = getTooltipContent();

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-4 sm:p-6 space-y-6 flex-grow overflow-y-auto max-h-[calc(100vh-136px)]">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">CSV Upload</h2>
          </div>
        </div>

        <FileUpload
          onboardingData={onboardingData}
          saveOnboardingData={saveOnboardingData}
          onPendingStateChange={setFileUploadPending}
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
                  fileUploadPending
                }
                color="primary"
                onPress={handleNext}
                size="lg"
              >
                {fileUploadPending ? "Saving..." : "Next"}
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}; 