import React from "react";
import { Button, Tooltip } from "@heroui/react";
import ArtistAndOrganization from "./identity-setup/artist-and-organization";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useOrganizationList, useSession } from "@clerk/nextjs";
import { CollaboratorBasicData } from "@/components/collaborator/CollaboratorBasicFields";
import { BasicInformationData } from "@/types/onboarding"

interface BasicInformationProps {
  onNext: () => void;
}

export const BasicInformation: React.FC<BasicInformationProps> = ({
  onNext,
}) => {
  const { setActive } = useOrganizationList();
  const { session } = useSession();

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [hasValidationErrors, setHasValidationErrors] = React.useState(false);
  
  // Local state for the form data
  const [formData, setFormData] = React.useState<BasicInformationData>({
    identity: {
      legalName: "",
      artistName: "",
      organization: "",
      pro: "",
      proId: "",
    },
    organizationMembers: [],
  });

  // Fetch existing basic information data
  const { data: existingData, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["basicInformation"],
    queryFn: async () => {
      const response = await axios.get("/api/onboarding/basic-information");
      return response.data;
    },
  });
  
  // Handle the fetched data with useEffect
  React.useEffect(() => {
    if (existingData) {
      setFormData({
        identity: existingData.identity || {
          legalName: "",
          artistName: "",
          organization: "",
          pro: "",
          proId: "",
        },
        organizationMembers: existingData.organizationMembers?.map((member: any) => ({
          id: member.id,
          legalName: member.legalName || "",
          artistName: member.artistName || "",
          email: member.email || "",
          region: member.region || "",
          pro: member.pro || "",
          proId: member.proId || "",
          profileLink: member.profileLink || "",
          bio: member.bio || "",
          phoneNumber: member.phoneNumber || "",
        })) || [],
      });
    }
  }, [existingData]);
  
  // Local update function
  const handleUpdate = (newData: BasicInformationData) => {
    setFormData(newData);
  };

  // Save basic information mutation
  const saveBasicInfo = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        "/api/onboarding/basic-information",
        formData
      );

      return response.data;
    },
    onSuccess: async (responseData) => {
      if (responseData.organizationId && setActive && session?.id) {
        await setActive({
          session: session.id,
          organization: responseData.organizationId,
        });
      }
      // Move to next step
      onNext();
    },
    onError: (error: any) => {
      console.error("Error saving basic information:", error);
      toast.error(
        error.response?.data?.error || "Failed to save basic information"
      );
    },
  });

  const handleSave = () => {
    // Validate required fields
    if (
      !formData.identity.legalName.trim() ||
      !formData.identity.organization.trim()
    ) {
      const newErrors: Record<string, string> = {};
      if (!formData.identity.legalName.trim()) {
        newErrors.legalNames = "Legal name is required";
      }
      if (!formData.identity.organization.trim()) {
        newErrors.organization = "Organization name is required";
      }
      setErrors(newErrors);
      return;
    }

    setErrors({});
    saveBasicInfo.mutate();
  };

  const getTooltipContent = () => {
    if (errors.legalNames) {
      return "Legal name is required";
    }
    if (errors.organization) {
      return "Organization name is required";
    }
    if (saveBasicInfo.isPending) {
      return "Saving basic information...";
    }
    return undefined;
  };

  const tooltipContent = getTooltipContent();

  if (isLoadingExisting) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-default-500">Loading your basic information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-4 sm:p-6 space-y-6 flex-grow overflow-y-auto max-h-[calc(100vh-136px)]">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Basic Information</h2>
            <p className="text-default-500">
              Set up your profile and organization.
            </p>
          </div>
        </div>

        <ArtistAndOrganization
          data={formData}
          onUpdate={handleUpdate}
          onValidationChange={setHasValidationErrors}
        />
      </div>

      <div className="sticky bottom-0 bg-background border-t p-4 sm:p-6">
        <div className="flex justify-end">
          <Tooltip
            content={tooltipContent}
            placement="top"
            isDisabled={!tooltipContent}
          >
            <div className="inline-block">
              <Button
                isDisabled={
                  saveBasicInfo.isPending ||
                  hasValidationErrors
                }
                color="primary"
                onPress={handleSave}
                size="lg"
              >
                {saveBasicInfo.isPending ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}; 