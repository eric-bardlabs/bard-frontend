import React from "react";
import { Avatar, Button, Chip, Input, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { OrganizationMember } from "@/lib/api/onboarding";

interface OrganizationMembersListProps {
  members: OrganizationMember[];
  onRemove: (id: string) => void;
}

export const OrganizationMembersList: React.FC<
  OrganizationMembersListProps
> = ({ members, onRemove }) => {
  if (members.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
        <Icon icon="lucide:users" className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          Click "Add Member" to add team members.
        </p>
        <p className="mt-2 text-xs text-gray-400 max-w-md mx-auto">
          Add other internal members of the organization, such as other members
          of the band or a manager. They will not be notified or invited without
          your explicit consent. You can invite them post onboarding.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="border border-gray-200 rounded-md p-4 bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <Avatar name={member.legal_name} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {member.legal_name || member.artist_name}
                    </p>
                    {member.artist_name && (
                      <Chip size="sm" variant="flat" color="primary">
                        {member.artist_name}
                      </Chip>
                    )}
                  </div>
                  <p className="text-small text-default-500">{member.email}</p>
                </div>
              </div>
            </div>
            <Button
              isIconOnly
              variant="light"
              color="danger"
              onPress={() => onRemove(member.id || "")}
              aria-label="Remove member"
              size="sm"
            >
              <Icon icon="lucide:trash-2" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
