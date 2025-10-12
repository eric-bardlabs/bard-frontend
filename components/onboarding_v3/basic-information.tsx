import React from "react";
import { Button, Tooltip } from "@heroui/react";
import ArtistAndOrganization from "./identity-setup/artist-and-organization";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOrganizationList, useSession, useAuth } from "@clerk/nextjs";
import { BasicInformationData } from "@/components/types/onboarding";
import { fetchBasicInformation, OrganizationMember, saveBasicInformation } from "@/lib/api/onboarding";

interface BasicInformationProps {
  onNext: () => void;
}

export const BasicInformation: React.FC<BasicInformationProps> = ({
  onNext,
}) => {
  const { setActive } = useOrganizationList();
  const { session } = useSession();
  const { getToken } = useAuth();

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [hasValidationErrors, setHasValidationErrors] = React.useState(false);
  
  // Local state for the form data
  const [formData, setFormData] = React.useState<BasicInformationData>({
    identity: {
      legal_name: "",
      artist_name: "",
      organization: "",
      pro: "",
      pro_id: "",
    },
    organization_members: [],
  });

  // Fetch existing basic information data
  const { data: existingData, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["basicInformation"],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("No auth token available");
      }
      return await fetchBasicInformation({ token });
    },
  });
  
  // Handle the fetched data with useEffect
  React.useEffect(() => {
    if (existingData) {
      setFormData({
        identity: existingData.identity || {
          legal_name: "",
          artist_name: "",
          organization: "",
          pro: "",
          pro_id: "",
        },
        organization_members: existingData.organization_members?.map((member: OrganizationMember) => ({
          id: member.id,
          legal_name: member.legal_name || "",
          artist_name: member.artist_name || "",
          email: member.email || "",
          region: member.region || "",
          pro: member.pro || "",
          pro_id: member.pro_id || "",
          profile_link: member.profile_link || "",
          bio: member.bio || "",
          phone_number: member.phone_number || "",
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
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("No auth token available");
      }

      // Convert frontend data format to API format
      const apiData = {
        identity: {
          legal_name: formData.identity.legal_name,
          artist_name: formData.identity.artist_name,
          organization: formData.identity.organization,
          pro: formData.identity.pro,
          pro_id: formData.identity.pro_id,
        },
        organization_members: formData.organization_members,
      };

      return await saveBasicInformation({ token, data: apiData });
    },
    onSuccess: async (responseData) => {
      if (responseData.organization_id && setActive && session?.id) {
        await setActive({
          session: session.id,
          organization: responseData.organization_id,
        });
      }
      // Move to next step
      onNext();
    },
    onError: (error: any) => {
      console.error("Error saving basic information:", error);
      toast.error(
        error.message || "Failed to save basic information"
      );
    },
  });

  const handleSave = () => {
    // Validate required fields
    if (
      !formData.identity.legal_name.trim() ||
      !formData.identity.organization.trim()
    ) {
      const newErrors: Record<string, string> = {};
      if (!formData.identity.legal_name.trim()) {
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