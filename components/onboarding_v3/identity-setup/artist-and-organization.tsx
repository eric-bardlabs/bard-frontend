import {
  Card,
  CardBody,
  Input,
  Button,
  SelectItem,
  Select,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { OnboardingCollaboratorModal } from "@/components/collaborator/OnboardingCollaboratorModal";
import { OrganizationMembersList } from "./organization-members-list";
import { useQueryClient } from "@tanstack/react-query";
import { BasicInformationData } from "@/types/onboarding";
import { typeid } from "typeid-js";

interface ArtistAndOrganizationProps {
  data: BasicInformationData;
  onUpdate: (data: BasicInformationData) => void;
  onCreateCollaborator?: () => void;
  onValidationChange?: (hasError: boolean) => void;
}

export default function ArtistAndOrganization({
  data,
  onUpdate,
  onValidationChange,
}: ArtistAndOrganizationProps) {
  const queryClient = useQueryClient();
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [proIdError, setProIdError] = useState<string>("");

  // Validate all fields whenever data changes
  useEffect(() => {
    const hasRequiredFieldErrors =
      !data.identity?.legalName?.trim() || !data.identity?.organization?.trim();
    const hasProIdError = proIdError !== "";
    onValidationChange?.(hasRequiredFieldErrors || hasProIdError);
  }, [
    data.identity?.legalName,
    data.identity?.organization,
    proIdError,
    onValidationChange,
  ]);

  const orgCollaborators = data.organizationMembers;

  const removeCollaborator = (id: string) => {
    const newData = { ...data };
    newData.organizationMembers = newData.organizationMembers?.filter(
      (collaborator) => collaborator.id !== id
    );
    onUpdate(newData);
  };
  const validateProId = (value: string) => {
    // Skip validation if empty
    if (!value) {
      setProIdError("");
      return;
    }

    // Check if it contains only digits
    if (!/^\d+$/.test(value)) {
      setProIdError("PRO ID must contain only digits");
      return;
    }

    // Check if it's a 9-11 digit number
    if (value.length < 9 || value.length > 11) {
      setProIdError("PRO ID must be 9-11 digits");
    } else {
      setProIdError("");
    }
  };

  return (
    <Card className="flex-1 mt-4">
      <CardBody className="space-y-6">
        <div className="flex-1 space-y-4 pt-4 px-4">
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:user" className="text-primary" />
                <h2 className="text-lg font-medium">Your Personal Profile</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Legal Name"
                placeholder="Enter your legal name"
                value={data.identity?.legalName || ""}
                onValueChange={(value) =>
                  onUpdate({
                    ...data,
                    identity: {
                      ...data.identity,
                      legalName: value,
                    },
                  })
                }
                isRequired
                className="max-w-xl"
              />
              <Input
                label="Artist Name"
                placeholder="Enter your artist name"
                value={data.identity?.artistName || ""}
                onValueChange={(value) =>
                  onUpdate({
                    ...data,
                    identity: {
                      ...data.identity,
                      artistName: value,
                    },
                  })
                }
                className="max-w-xl"
              />
              <Select
                label="PRO (Performance Rights Organization)"
                placeholder="Select your PRO"
                selectedKeys={data.identity?.pro ? [data.identity.pro] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  onUpdate({
                    ...data,
                    identity: {
                      ...data.identity,
                      pro: selectedKey,
                    },
                  });
                }}
                className="max-w-xl"
              >
                <SelectItem key="ASCAP">ASCAP</SelectItem>
                <SelectItem key="BMI">BMI</SelectItem>
                <SelectItem key="SESAC">SESAC</SelectItem>
                <SelectItem key="SOCAN">SOCAN</SelectItem>
              </Select>
              <Input
                label="PRO ID"
                placeholder="Enter your PRO ID number"
                value={data.identity?.proId || ""}
                onValueChange={(value) => {
                  validateProId(value);
                  onUpdate({
                    ...data,
                    identity: {
                      ...data.identity,
                      proId: value,
                    },
                  });
                }}
                isInvalid={!!proIdError}
                errorMessage={proIdError}
                className="max-w-xl"
              />
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="border-b border-gray-100 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:building" className="text-primary" />
                <h2 className="text-lg font-medium">Your Organization</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This is the musical act your catalog is focused around (e.g.
                Taylor Swift or Swedish House Mafia). You are an user and your
                org can have multiple users (the artist(s), managers, etc.).
              </p>
            </div>

            <div className="space-y-6">
              <Input
                label="Organization Name"
                placeholder="Enter your organization name"
                value={data.identity?.organization || ""}
                onValueChange={(value) =>
                  onUpdate({
                    ...data,
                    identity: {
                      ...data.identity,
                      organization: value,
                    },
                  })
                }
                isRequired
                // className="max-w-md"
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium">Organization Members</h3>
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<Icon icon="lucide:plus" />}
                    onPress={() => setIsAddingCollaborator(true)}
                    size="sm"
                  >
                    Add Members for Your Organization
                  </Button>
                </div>

                <OrganizationMembersList
                  members={orgCollaborators || []}
                  onRemove={removeCollaborator}
                />
              </div>
            </div>
          </div>

          <OnboardingCollaboratorModal
            isOpen={isAddingCollaborator}
            onClose={() => {
              setIsAddingCollaborator(false);
            }}
            onSubmit={async (collaboratorData) => {
              // Add to organizationMembers state
              onUpdate({
                ...data,
                organizationMembers: [
                  ...(data.organizationMembers || []),
                  {
                    id: typeid("collabprofile").toString(),
                    legalName: collaboratorData.legal_name,
                    artistName: collaboratorData.artist_name,
                    email: collaboratorData.email,
                    region: collaboratorData.region,
                    pro: collaboratorData.pro,
                    proId: collaboratorData.pro_id,
                    profileLink: collaboratorData.profile_link,
                    bio: collaboratorData.bio,
                    phoneNumber: collaboratorData.phone_number,
                    initialSource: collaboratorData.initial_source,
                  },
                ],
              });

              return { success: true };
            }}
            creationSource="organization"
          />
        </div>
      </CardBody>
    </Card>
  );
}
