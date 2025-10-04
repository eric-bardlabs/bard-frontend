"use client";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";

import { CollaboratorProfile } from "@/db/schema";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Input,
  Textarea,
  Spinner,
} from "@heroui/react";
// import type { CardProps } from "@heroui/react";

const ProfileEdit = () => {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const router = useRouter()

  const { data, isLoading } = useQuery<{
    collaboratorProfile: CollaboratorProfile;
  }>({
    queryKey: ["myCollaboratorProfile"],
    queryFn: () =>
      axios.get("/api/collaborators/myProfile").then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const myProfile = data?.collaboratorProfile;
  if (!myProfile) {
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-row justify-between md:mt-0">
        <div style={{ marginBottom: "40px" }}>
          <h1 className="text-[24px] md:text-[36px]">Edit Profile</h1>
        </div>
      </div>
      <Card className="max-w-3xl p-2">
        <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
          <p className="text-large">Collaborator Profile Details</p>
          <p className="text-small text-default-400">
            This profile will show up for other Organizations you are working with
          </p>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Legal Name"
            labelPlacement="outside"
            placeholder="Legal Name"
          />
          <Input
            label="Artist Name"
            labelPlacement="outside"
            placeholder="Artist Name"
          />
          <Input
            label="Contact Email"
            labelPlacement="outside"
            placeholder="Enter contact email"
          />
          <Input
            label="Phone Number"
            labelPlacement="outside"
            placeholder="Enter phone number"
          />
          <Input
            label="PRO"
            labelPlacement="outside"
            placeholder="Enter PRO"
          />
          <Input
            label="PRO ID"
            labelPlacement="outside"
            placeholder="Enter PRO ID"
          />
          <Input
            label="Region"
            labelPlacement="outside"
            placeholder="Enter region"
          />
          <Input
            label="Link to Profile"
            labelPlacement="outside"
            placeholder="Enter link to profile"
          />
          <Textarea
            label="Bio"
            labelPlacement="outside"
            placeholder="Enter a short bio"
          />
        </CardBody>

        <CardFooter className="mt-4 justify-end gap-2">
          <Button radius="full" variant="bordered" onClick={() => router.push("/profile")}>
            Cancel
          </Button>
          <Button color="primary" radius="full" onClick={() => router.push("/profile")}>
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfileEdit;
