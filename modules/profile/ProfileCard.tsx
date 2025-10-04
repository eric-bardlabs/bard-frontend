"use client";
import "react-big-calendar/lib/css/react-big-calendar.css";
import React, { useState } from "react";

import { CollaboratorProfile } from "@/db/schema";
import { Icon } from "@iconify/react";
import ProfileEditForm from "./components/ProfileEditForm";

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Avatar,
  Divider,
} from "@heroui/react";

export const ProfileCard = ({
  myProfile,
  showEdit = true,
  showEmail = true,
  headerOverride,
  subHeaderOverride,
  isPopOver = false,
}: {
  myProfile: CollaboratorProfile;
  showEdit?: Boolean;
  showEmail?: Boolean;
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
      <div className="text-small font-medium">{value || children}</div>
    </div>
  ));

  const [editing, setEditing] = useState(false);

  const s = isPopOver
    ? "w-full max-w-xl p-2 self-center"
    : "w-full max-w-5xl p-2 self-center";

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
      <CardBody className="space-y-2 max-w-xl px-6">
        {editing ? (
          <ProfileEditForm
            myProfile={myProfile}
            onSuccess={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div>
            <CellValue label="Legal Name" value={myProfile.legalName} />
            <CellValue label="Artist Name" value={myProfile.artistName} />
            {showEmail && (
              <CellValue label="Email Address" value={myProfile.email} />
            )}
            <CellValue
              label="Profile Picture"
              value={
                <div className="flex gap-2">
                  <Avatar
                    className="h-6 w-6"
                    src={myProfile.profilePic ?? undefined}
                  />
                </div>
              }
            />
            <CellValue label="Region" value={myProfile.region} />
            <CellValue label="PRO" value={myProfile.pro} />
            <CellValue label="PRO ID" value={myProfile.proId} />
            <CellValue label="Link to Profile" value={myProfile.profileLink} />
            <CellValue
              label="Bio"
              value={<p className="max-w-xs">{myProfile.bio}</p>}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
};
