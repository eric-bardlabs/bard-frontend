import React from "react";
import { ReviewSaveModal } from "./review-save-modal";
import { OnboardingFormData } from "@/types/onboarding";

interface CatalogReviewStepProps {
  onboardingData: OnboardingFormData;
  saveOnboardingData: (data: OnboardingFormData) => void;
  onNext: () => void;
  saveData?: (onSuccess?: () => void) => void;
  isSaving?: boolean;
}

export const CatalogReviewStep: React.FC<CatalogReviewStepProps> = ({
  onboardingData,
  saveOnboardingData,
  onNext,
}) => {
  const [showReviewModal, setShowReviewModal] = React.useState(true);

  const handleReviewModalContinue = () => {
    // Mark that the modal has been shown
    saveOnboardingData({
      ...onboardingData,
      reviewAndSaveModalCompleted: true,
    });

    onNext();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-4 sm:p-6 space-y-6 flex-grow overflow-y-auto max-h-[calc(100vh-136px)]">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Review and Save</h2>
          </div>
        </div>

        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-default-500">Setting up review...</p>
          </div>
        </div>
      </div>

      <ReviewSaveModal 
        isOpen={showReviewModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleReviewModalContinue();
          }
        }}
      />
    </div>
  );
}; 