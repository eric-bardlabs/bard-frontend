"use client";

import React from "react";
import { Progress, Button, Card, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { CollaboratorEntry } from "@/components/onboarding_v3/collaborator-entry";
import { ReviewAndSave } from "@/components/onboarding_v3/review-and-save";
import { SplitsEntry } from "@/components/onboarding_v3/splits-entry";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useImmer } from "use-immer";
import { useAuth } from "@clerk/nextjs";
import { SongEntry } from "../../../components/onboarding_v3/song-entry";
import { OnboardingFormData, STEPS } from "@/components/types/onboarding";
import { BasicInformation } from "@/components/onboarding_v3/basic-information";
import { CatalogInputStep } from "@/components/onboarding_v3/catalog-input-step";
import { CatalogReviewStep } from "@/components/onboarding_v3/catalog-review-step";
import { SpotifyImportStep } from "@/components/onboarding_v3/spotify-import-step";
import { CalendarConnectStep } from "@/components/onboarding_v3/calendar-connect-step";
import { FileUploadStep } from "@/components/onboarding_v3/file-upload-step";
import { useClerk } from "@clerk/nextjs";
import { saveInitialData } from "@/lib/api/onboarding";
import { useUserContext } from "@/components/UserContext";

export default function OnboardingV3() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isInitialized, setIsInitialized] = React.useState(false);

  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { user: userData, isLoading: isLoadingUserData, refetch: refetchUserData } = useUserContext();

  const [formData, updateFormData] = useImmer<OnboardingFormData>({
    googleSessionId: null,
    links: [],
    uploadedFiles: [],
    maxStep: 0,
    catalogModalCompleted: false,
    reviewAndSaveModalCompleted: false,
  });

    // Use userData from context instead of separate query
    const onboardingData = userData ? {
      userData: userData,
      initialData: userData.initial_data || null,
    } : null;
    const isLoadingOnboardingData = isLoadingUserData;
    const refetchOnboardingData = () => {
      // Refetch user data from UserContext which includes initial_data
      refetchUserData();
    };

  // Shared navigation methods
  const handleNext = React.useCallback(
    () => {
      let nextStep: number;

      // Default progression logic
      if (currentStep === STEPS.BASIC_INFO) {
        nextStep = formData.catalogModalCompleted
          ? STEPS.SPOTIFY_IMPORT
          : STEPS.CATALOG_INPUT;
      } else if (currentStep === STEPS.FILE_UPLOAD) {
        nextStep = formData.reviewAndSaveModalCompleted
          ? STEPS.COLLABORATORS
          : STEPS.CATALOG_REVIEW;
      } else {
        nextStep = currentStep + 1;
      }

      setCurrentStep(nextStep);

      // Update maxStep if we're progressing further
      if (nextStep > (formData.maxStep || 0)) {
        updateFormData((draft) => {
          draft.maxStep = nextStep;
        });

        // Save maxStep to backend
        saveOnboardingData.mutate({
          data: {
            ...formData,
            maxStep: nextStep,
          },
        });
      }
    },
    [currentStep, formData, updateFormData]
  );

  const handlePrevious = React.useCallback(
    (customPrevStep?: number) => {
      if (customPrevStep !== undefined) {
        setCurrentStep(customPrevStep);
      } else {
        // Default back navigation
        if (
          currentStep === STEPS.SPOTIFY_IMPORT &&
          !formData.catalogModalCompleted
        ) {
          setCurrentStep(STEPS.CATALOG_INPUT);
        } else if (
          currentStep === STEPS.COLLABORATORS &&
          !formData.reviewAndSaveModalCompleted
        ) {
          setCurrentStep(STEPS.CATALOG_REVIEW);
        } else {
          setCurrentStep(Math.max(0, currentStep - 1));
        }
      }
    },
    [currentStep, formData]
  );

  const saveOnboardingData = useMutation({
    mutationFn: async (data: {
      data: OnboardingFormData;
      onSuccess?: () => void;
    }) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("No auth token available");
      }

      return await saveInitialData({
        token,
        data: {
          googleSessionId: data.data.googleSessionId || undefined,
          links: data.data.links,
          uploadedFiles: data.data.uploadedFiles,
          maxStep: data.data.maxStep,
          catalogModalCompleted: data.data.catalogModalCompleted || false,
          reviewAndSaveModalCompleted: data.data.reviewAndSaveModalCompleted || false,
        },
      });
    },
    onSuccess: (data, variables) => {
      // UserContext will automatically update when user data changes
      // Call the custom onSuccess if provided
      refetchOnboardingData();
      if (variables.onSuccess) {
        variables.onSuccess();
      }
    },
    onError: (error) => {
      console.error("Error saving data:", error);
      // Don't invalidate on error
    },
  });

  const handleSaveOnboardingData = (data: OnboardingFormData) => {
    saveOnboardingData.mutate({
      data: data,
    });
  };


  const handleDismissReviewModal = (onSuccess?: () => void) => {
    const nextStep = STEPS.COLLABORATORS;
    saveOnboardingData.mutate({
      data: {
        ...formData,
        reviewAndSaveModalCompleted: true,
        maxStep: Math.max(formData.maxStep || 0, nextStep),
      },
      onSuccess: () => {
        handleNext();
        onSuccess?.();
      },
    });
  };

  // Use useEffect to handle state updates when query data changes
  React.useEffect(() => {
    if (onboardingData?.initialData) {
      const { initialData } = onboardingData;

      const maxStep = initialData.maxStep || 0;

      // Navigate to the furthest step they've been to
      if (!isInitialized) {
        setCurrentStep(maxStep);
        setIsInitialized(true);
      }

      updateFormData((draft) => {
        draft.links = initialData.links || [];
        draft.uploadedFiles = initialData.uploadedFiles || [];
        draft.catalogModalCompleted =
          initialData.catalogModalCompleted || false;
        draft.reviewAndSaveModalCompleted =
          initialData.reviewAndSaveModalCompleted || false;
        draft.maxStep = maxStep;
      });
    }
  }, [onboardingData, isInitialized, updateFormData]);

  const steps = [
    {
      id: STEPS.BASIC_INFO,
      title: "Basic Information",
      icon: "lucide:user",
      type: "main",
      component: <BasicInformation onNext={() => handleNext()} />,
    },
    {
      id: STEPS.CATALOG_INPUT,
      title: "Catalog Input",
      icon: "lucide:disc-3",
      type: "main",
      component: (
        <CatalogInputStep
          onboardingData={formData}
          onNext={() => handleNext()}
          saveInitialData={handleSaveOnboardingData}
        />
      ),
    },
    {
      id: STEPS.SPOTIFY_IMPORT,
      title: "Spotify Import",
      icon: "logos:spotify-icon",
      type: "secondary",
      component: (
        <SpotifyImportStep
          onboardingData={formData}
          onPrevious={() => handlePrevious(STEPS.BASIC_INFO)}
          onNext={() => handleNext()}
          saveInitialData={handleSaveOnboardingData}
          isSaving={saveOnboardingData.isPending}
        />
      ),
    },
    {
      id: STEPS.CALENDAR_CONNECT,
      title: "Calendar Integration",
      icon: "lucide:calendar",
      type: "secondary",
      component: (
        <CalendarConnectStep
          onboardingData={formData}
          saveOnboardingData={handleSaveOnboardingData}
          onPrevious={() => handlePrevious()}
          onNext={() => handleNext()}
        />
      ),
    },
    {
      id: STEPS.FILE_UPLOAD,
      title: "CSV Upload",
      icon: "lucide:file",
      type: "secondary",
      component: (
        <FileUploadStep
          onboardingData={formData}
          saveOnboardingData={handleSaveOnboardingData}
          onPrevious={() => handlePrevious()}
          onNext={() => handleNext()}
        />
      ),
    },
    {
      id: STEPS.CATALOG_REVIEW,
      title: "Review and Save",
      icon: "lucide:clipboard-check",
      type: "main",
      component: (
        <CatalogReviewStep
          onboardingData={formData}
          saveOnboardingData={handleSaveOnboardingData}
          onNext={() => handleNext()}
          saveData={handleDismissReviewModal}
          isSaving={saveOnboardingData.isPending}
        />
      ),
    },
    {
      id: STEPS.COLLABORATORS,
      title: "Collaborators Review",
      icon: "lucide:users",
      type: "secondary",
      component: (
        <CollaboratorEntry
          onNext={() => handleNext()}
          onBack={() => handlePrevious(STEPS.FILE_UPLOAD)}
        />
      ),
    },
    {
      id: STEPS.SONGS,
      title: "Songs Review",
      icon: "lucide:music",
      type: "secondary",
      component: (
        <SongEntry
          onNext={() => handleNext()}
          onBack={() => handlePrevious()}
        />
      ),
    },
    {
      id: STEPS.SPLITS,
      title: "Splits Review",
      icon: "lucide:pie-chart",
      type: "secondary",
      component: (
        <SplitsEntry
          onNext={() => handleNext()}
          onBack={() => handlePrevious()}
        />
      ),
    },
    {
      id: STEPS.COMPLETE,
      title: "Complete Onboarding",
      icon: "lucide:rocket",
      type: "main",
      component: (
        <ReviewAndSave
          onNavigateToStep={(stepId) => {
            if (stepId <= (formData.maxStep || 0)) {
              setCurrentStep(stepId);
            }
          }}
        />
      ),
    },
  ];

  // Helper function to check if a step is completed
  const isStepCompleted = (stepId: number) => {
    return stepId < currentStep;
  };

  // Calculate progress based on total main steps
  const totalSteps = steps.length;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  if (
    isLoadingOnboardingData
  ) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col mx-[-16px] my-[-16px]">
      <div className="border-b border-divider flex items-center gap-2 p-4">
        <Icon
          icon="lucide:music"
          width={24}
          height={24}
          className="text-primary"
        />
        <p className="font-bold text-inherit ml-2">Bardlabs Onboarding</p>
      </div>

      <div className="flex-grow flex flex-col md:flex-row">
        {/* Improved vertical stepper */}
        <div className="flex flex-col w-full md:w-64 lg:w-72 border-r border-divider bg-content1 p-4">
          <div className="flex flex-col flex-1 gap-2">
            <p className="text-sm font-medium text-default-500 mb-2">
              Onboarding Steps
            </p>

            {/* Main steps with collapsible sub-steps */}
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = isStepCompleted(step.id);
              const maxStep = formData.maxStep || 0;
              const stepId = step.id;
              if (step.type === "main") {
                return (
                  <Button
                    key={step.id}
                    className={`justify-start h-auto py-3 ${
                      isActive
                        ? "bg-primary/10 text-primary border-primary"
                        : "text-default-600"
                    } ${isCompleted ? "text-success" : ""}`}
                    variant={isActive ? "bordered" : "light"}
                    onPress={() => {
                      if (step.id <= maxStep) {
                        if (stepId === STEPS.CATALOG_INPUT) {
                          // Catalog input step - check if modal has been completed
                          if (formData.catalogModalCompleted) {
                            setCurrentStep(STEPS.SPOTIFY_IMPORT);
                          } else {
                            setCurrentStep(STEPS.CATALOG_INPUT);
                          }
                        } else if (stepId === STEPS.CATALOG_REVIEW) {
                          // Catalog review step - check if modal has been shown
                          if (formData.reviewAndSaveModalCompleted) {
                            setCurrentStep(STEPS.COLLABORATORS);
                          } else {
                            setCurrentStep(STEPS.CATALOG_REVIEW);
                          }
                        } else {
                          setCurrentStep(stepId);
                        }
                      }
                    }}
                    startContent={
                      <div className="flex items-center">
                        {isCompleted ? (
                          <Icon
                            icon="lucide:check"
                            className="text-success"
                            width={16}
                            height={16}
                          />
                        ) : (
                          <Icon
                            icon={step.icon}
                            className={
                              isActive ? "text-primary" : "text-default-500"
                            }
                            width={16}
                            height={16}
                          />
                        )}
                      </div>
                    }
                    fullWidth
                  >
                    <span className="text-sm font-medium ml-2">
                      {step.title}
                    </span>
                  </Button>
                );
              } else if (step.type === "secondary") {
                return (
                  <Button
                    key={step.id}
                    className={`justify-start h-auto py-2 pl-10 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-default-600"
                    } ${isCompleted ? "text-success" : ""}`}
                    variant={isActive ? "flat" : "light"}
                    onPress={() => {
                      if (step.id <= maxStep) {
                        setCurrentStep(step.id);
                      }
                    }}
                    startContent={
                      <div className="flex items-center">
                        {isCompleted ? (
                          <Icon
                            icon="lucide:check"
                            className="text-success"
                            width={16}
                            height={16}
                          />
                        ) : (
                          <Icon
                            icon={step.icon}
                            className={
                              isActive ? "text-primary" : "text-default-500"
                            }
                            width={16}
                            height={16}
                          />
                        )}
                      </div>
                    }
                    fullWidth
                  >
                    <span className="text-xs font-medium ml-2">
                      {step.title}
                    </span>
                  </Button>
                );
              } else {
                return null;
              }
            })}
          </div>

          <div className="mt-8">
            <Progress
              aria-label="Onboarding progress"
              value={progressPercentage}
              className="max-w-md"
              color="primary"
              showValueLabel
              valueLabel={`${currentStep} of ${totalSteps - 1}`}
              size="sm"
            />
          </div>

          <div className="mt-8 p-4 border border-dashed rounded-lg border-default-300">
            <p className="text-sm text-default-600 mb-2">Need help?</p>
            <p className="text-xs text-default-500">
              You can navigate between completed steps by clicking on them in
              the menu.
            </p>
            <Button
              className="mt-4 w-full"
              variant="flat"
              color="default"
              startContent={<Icon icon="lucide:help-circle" />}
              size="sm"
              onPress={() => {
                window.location.href =
                  "mailto:charles@bardlabs.co?subject=Bardlabs%20Onboarding%20Support";
              }}
            >
              Get Support
            </Button>
          </div>
          <Button
            className="mt-2 w-full"
            variant="bordered"
            color="primary"
            startContent={<Icon icon="lucide:log-out" />}
            size="sm"
            onPress={() => {
              signOut();
            }}
          >
            Log Out
          </Button>
        </div>

        {/* Main content area */}
        <div className="flex-grow p-0">
          <Card className="p-0 sm:p-0 w-full h-full rounded-none">
            {steps[currentStep].component}
          </Card>
        </div>
      </div>
    </div>
  );
}
