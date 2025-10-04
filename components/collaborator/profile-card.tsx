"use client";
import "react-big-calendar/lib/css/react-big-calendar.css";
import React, { useState } from "react";

import { Collaborator } from "@/lib/api/collaborators";
import ProfileEditForm from "./profile-edit-form";

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Avatar,
  Divider,
  Chip,
  Link,
  Spacer,
} from "@heroui/react";
import { Icon } from "@iconify/react";

export const ProfileCard = ({
  myProfile,
  showEdit = true,
  showEmail = true,
  showRelationships = false,
  headerOverride,
  subHeaderOverride,
  isPopOver = false,
}: {
  myProfile: Collaborator;
  showEdit?: Boolean;
  showEmail?: Boolean;
  showRelationships?: Boolean;
  headerOverride?: string;
  subHeaderOverride?: string;
  isPopOver?: Boolean;
}) => {
  const CellValue = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
      label: string;
      value: React.ReactNode;
    }
  >(({ label, value, children, ...props }, ref) => (
    <div
      ref={ref}
      className="flex items-center justify-between py-2"
      {...props}
    >
      <div className="text-small text-default-500">{label}</div>
      <div className="text-small font-medium">{value || children || "-"}</div>
    </div>
  ));

  const [editing, setEditing] = useState(false);

  const s = isPopOver
    ? "w-full max-w-2xl p-2 self-center"
    : "w-full max-w-6xl p-2 self-center";

  return (
    <Card className={s}>
      <CardHeader className="justify-between px-4">
        <div className="flex flex-col items-start mr-3">
          <p className="text-large">
            {headerOverride ?? "My Collaborator Profile"}
          </p>
          <p className="text-small text-default-500">
            {subHeaderOverride ??
              "This is the profile that will be shared with Organizations that you work with"}
          </p>
        </div>
        {!editing && showEdit && (
          <Button color="primary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </CardHeader>
      <Divider className="my-4" />
      <CardBody className="space-y-2 max-w-4xl px-6">
        {editing ? (
          <ProfileEditForm
            myProfile={myProfile}
            onSuccess={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div>
            {/* Basic Information Section */}
            <div className="space-y-2">
              <p className="text-medium font-semibold text-foreground mb-3 flex items-center gap-2">
                <Icon icon="mdi:account" className="w-4 h-4" />
                Basic Information
              </p>
              
              <CellValue label="Legal Name" value={myProfile.legal_name} />
              <CellValue label="Artist Name" value={myProfile.artist_name} />
              {showEmail && (
                <CellValue label="Email Address" value={myProfile.email} />
              )}
              <CellValue label="Phone Number" value={myProfile.phone_number} />
              <CellValue
                label="Profile Picture"
                value={
                  <div className="flex gap-2">
                    <Avatar
                      className="h-6 w-6"
                      src={myProfile.profile_link ?? undefined}
                    />
                  </div>
                }
              />
              <CellValue label="Region" value={myProfile.region} />
              <CellValue label="PRO" value={myProfile.pro} />
              <CellValue label="PRO ID" value={myProfile.pro_id} />
              <CellValue label="Link to Profile" value={myProfile.profile_link} />
              <CellValue
                label="Bio"
                value={<p className="max-w-md">{myProfile.bio}</p>}
              />
            </div>

            {/* Relationships */}
            {showRelationships && myProfile.relationships && (
              <>
                <Divider className="my-4" />
                <div className="space-y-2">
                  <p className="text-medium font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Icon icon="mdi:account-group" className="w-4 h-4" />
                    Relationships
                  </p>
                  
                  <CellValue 
                    label="Managers"
                    value={
                      myProfile.relationships.managers.length > 0 
                        ? myProfile.relationships.managers
                            .map(manager => manager.artist_name || manager.legal_name)
                            .join(', ')
                        : null
                    }
                  />
                  
                  <CellValue 
                    label="Members"
                    value={
                      myProfile.relationships.members.length > 0 
                        ? myProfile.relationships.members
                            .map(member => member.artist_name || member.legal_name)
                            .join(', ')
                        : null
                    }
                  />
                  
                  <CellValue 
                    label="Publishing Entities"
                    value={
                      myProfile.relationships.publishing_entities.length > 0 
                        ? myProfile.relationships.publishing_entities
                            .map(entity => entity.artist_name || entity.legal_name)
                            .join(', ')
                        : null
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
