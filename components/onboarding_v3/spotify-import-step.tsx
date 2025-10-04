import React from "react";
import { Button, Tooltip } from "@heroui/react";
import { SpotifyImport } from "./identity-setup/spotify-import";
import { OnboardingFormData } from "@/types/onboarding";


interface SpotifyImportStepProps {
  onboardingData: OnboardingFormData;
  onNext: () => void;
  onPrevious: () => void;
  saveInitialData?: (data: OnboardingFormData) => void;
  isSaving?: boolean;
}

export const SpotifyImportStep: React.FC<SpotifyImportStepProps> = ({
  onboardingData,
  onNext,
  onPrevious,
  saveInitialData,
  isSaving = false,
}) => {
  const [spotifyPending, setSpotifyPending] = React.useState(false);
  const [hasValidSpotifyUrl, setHasValidSpotifyUrl] = React.useState(false);
  const [showSpotifyImportModal, setShowSpotifyImportModal] = React.useState(false);

  const handleNext = () => {
    if (hasValidSpotifyUrl) {
      setShowSpotifyImportModal(true);
    } else {
      onNext();
    }
  };

  const handleSpotifyModalSkip = () => {
    setShowSpotifyImportModal(false);
    onNext();
  };

  const handleSpotifyModalImport = () => {
    setShowSpotifyImportModal(false);
  };

  const getTooltipContent = () => {
    if (spotifyPending)
      return "Importing from Spotify, this may take a few minutes...";
    if (isSaving) {
      return "Saving Spotify data...";
    }
    return undefined;
  };

  const tooltipContent = getTooltipContent();

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-4 sm:p-6 space-y-6 flex-grow overflow-y-auto max-h-[calc(100vh-136px)]">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Spotify Import</h2>
          </div>
        </div>

        <SpotifyImport
          onboardingData={onboardingData}
          onPendingStateChange={setSpotifyPending}
          onUrlValidationChange={setHasValidSpotifyUrl}
          showImportModal={showSpotifyImportModal}
          handleSpotifyModalSkip={handleSpotifyModalSkip}
          handleSpotifyModalImport={handleSpotifyModalImport}
          saveInitialData={saveInitialData}
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
                  isSaving ||
                  spotifyPending
                }
                color="primary"
                onPress={handleNext}
                size="lg"
              >
                {isSaving || spotifyPending ? "Saving..." : "Next"}
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}; 