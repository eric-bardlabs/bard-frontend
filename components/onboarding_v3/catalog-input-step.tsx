import React from "react";
import { CatalogInputModal } from "./catalog-input-modal";
import { OnboardingFormData } from "@/types/onboarding";

interface CatalogInputStepProps {
  onboardingData: OnboardingFormData;
  onNext: () => void;
  saveInitialData: (data: any) => void;
}

export const CatalogInputStep: React.FC<CatalogInputStepProps> = ({
  onboardingData,
  onNext,
  saveInitialData,
}) => {
  const [showCatalogInputModal, setShowCatalogInputModal] = React.useState(true);
  const handleCatalogInputModalContinue = () => {
    saveInitialData({
      ...onboardingData,
      catalogModalCompleted: true,
    });
    // Save data and then proceed to next step
    setShowCatalogInputModal(false);
    onNext();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-4 sm:p-6 space-y-6 flex-grow overflow-y-auto max-h-[calc(100vh-136px)]">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Catalog Input</h2>
          </div>
        </div>

        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-default-500">Setting up catalog input...</p>
          </div>
        </div>
      </div>

      <CatalogInputModal 
        isOpen={showCatalogInputModal}
        onOpenChange={(isOpen) => {
          console.log("handling catalog input modal", isOpen);
          if (!isOpen) {
            handleCatalogInputModalContinue();
          }
        }}
      />
    </div>
  );
}; 