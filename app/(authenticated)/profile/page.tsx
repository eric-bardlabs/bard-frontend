"use client";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";

import React, { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";

import {
  CollaboratorProfile,
  OrganizationCollaboratorProfile,
  CollaboratorRole,
} from "@/db/schema";
import { Icon } from "@iconify/react";

import { Tabs, Tab } from "@heroui/react";
import { ProfileCard, ProfileSharing } from "@/modules/profile/";
import { useAuth } from "@clerk/nextjs";

const Profile = () => {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const { userId } = useAuth();
  const router = useRouter();

  const { data: myProfileData, isLoading: myProfileIsLoading } = useQuery<{
    collaboratorProfile: CollaboratorProfile;
  }>({
    queryKey: ["myCollaboratorProfile"],
    queryFn: () =>
      axios.get("/api/collaborators/myProfile").then((res) => res.data),
  });

  //   const { data: invitationsData, isLoading: invitationsLoading } = useQuery<{
  //     collaboratorProfile: CollaboratorProfile;
  // }>({
  //     queryKey: ["getInvitations"],
  //     queryFn: () =>
  //       axios.get("/api/invites").then((res) => res.data),
  //   });
  const { data: profilesData, isLoading: ProfileIsLoading } = useQuery<{
    profiles: Array<
      CollaboratorProfile & {
        roles: Array<CollaboratorRole>;
        collabOrganization: Array<OrganizationCollaboratorProfile>;
      }
    >;
  }>({
    queryKey: ["getAllCollaboratorProfiles"],
    queryFn: () =>
      axios.get("/api/collaborators/myProfile/getAll").then((res) => res.data),
  });

  if (myProfileIsLoading || ProfileIsLoading) {
    return (
      <div className="w-full flex flex-col items-center">
        <Spinner size={48} />
      </div>
    );
  }

  if (!profilesData) {
    // TODO handle empty state
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-row justify-between md:mt-0">
          <div style={{ marginBottom: "40px" }}>
            <h1 className="text-[24px] md:text-[36px]">Profile</h1>
          </div>
        </div>
      </div>
    );
  }
  const myProfile = (profilesData.profiles ?? []).find(
    (p) => p.clerkUserId === userId
  );

  return (
    <div className="flex flex-col items-start h-screen">
      <div className="flex flex-row justify-between md:mt-0">
        <div style={{ marginBottom: "20px" }}>
          <h1 className="text-[24px] md:text-[36px]">Profile</h1>
        </div>
      </div>
      <Tabs
        classNames={{
          tabList: "mx-4 mt-6 text-3xl",
          tabContent: "text-large",
        }}
        className="self-center"
        size="lg"
      >
        <Tab
          key="account-settings"
          className="self-center w-2/3"
          textValue="Account Settings"
          title={
            <div className="flex items-center gap-1.5">
              <Icon icon="solar:user-id-bold" width={20} />
              <p>Profile</p>
            </div>
          }
        >
          {myProfile && <ProfileCard myProfile={myProfile} />}
        </Tab>
        <Tab
          key="notifications-settings"
          className="self-center w-2/3"
          textValue="Notification Settings"
          title={
            <div className="flex items-center gap-1.5">
              <Icon icon="solar:bell-bold" width={20} />
              <p>Sharing</p>
            </div>
          }
        >
          <ProfileSharing profiles={profilesData?.profiles} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default Profile;
