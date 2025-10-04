import React from "react";
import { FileUploader } from "./file-uploader";
import { UploadHistory } from "./upload-history";
import { FileUploadProvider } from "./file-upload-context";
import { OnboardingFormData } from "@/types/onboarding";

export default function FileUpload({
  onboardingData,
  saveOnboardingData,
  onPendingStateChange,
}: {
  onboardingData: OnboardingFormData;
  saveOnboardingData: (data: OnboardingFormData) => void;
  onPendingStateChange?: (pending: boolean) => void;
}) {
  return (
    <div className="bg-background p-4 md:p-8 flex-1">
      <div className="max-w-4xl mx-auto">
        <FileUploadProvider>
          <div className="grid gap-8">
            <FileUploader
              onboardingData={onboardingData}
              saveOnboardingData={saveOnboardingData}
              onPendingStateChange={onPendingStateChange}
            />
            <UploadHistory />
          </div>
        </FileUploadProvider>
      </div>
    </div>
  );
}
