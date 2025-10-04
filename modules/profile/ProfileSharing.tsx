"use client";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import React, { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";

import {
  CollaboratorProfile,
  CollaboratorRole,
  OrganizationCollaboratorProfile,
} from "@/db/schema";

import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Select,
  SelectItem,
  Divider,
} from "@heroui/react";
import { Organization } from "@clerk/nextjs/server";

const sharingOptions = [
  { key: "NONE", label: "Do not share my profile" },
  { key: "SHARED_BASIC", label: "Share my basic info" },
  {
    key: "SHARED_BUSINESS",
    label: "Share my business info",
  },
];

export const ProfileSharing = ({
  profiles,
}: {
  profiles: Array<
    CollaboratorProfile & {
      roles: Array<CollaboratorRole>;
      collabOrganization: Array<OrganizationCollaboratorProfile>;
    }
  >;
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
  const [sharingStatus, setSharingStatus] = useState<{ [key: string]: string }>(
    {}
  );

  const orgProfiles = profiles
    .map((profile) => profile.collabOrganization)
    .flat();
  const organizationIds = profiles
    .map((profile) =>
      profile.collabOrganization.map((org) => org.organizationId)
    )
    .flat();

  useEffect(() => {
    const orgToStatus = orgProfiles.reduce(
      (acc, curr) => {
        acc[curr.organizationId] = curr.collabStatus ?? "";
        return acc;
      },
      {} as { [key: string]: string }
    );
    setSharingStatus(orgToStatus);
  }, [profiles]);

  const { data: organizations, isLoading } = useQuery<Array<Organization>>({
    queryFn: () =>
      axios
        .post("/api/organizations/getByIds", { organizationIds })
        .then((res) => res.data),
    queryKey: ["getOrganizationsByIds"],
  });

  const [editingSharing, setEditingSharing] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center">
        <Spinner size={48} />
      </div>
    );
  }

  const orgByIds = (organizations ?? []).reduce(
    (acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    },
    {} as { [key: string]: Organization }
  );

  const getStatusString = (collabStatus) => {
    if (collabStatus === "SHARED_BASIC") {
      return "Sharing Basic Info";
    } else if (collabStatus === "SHARED_BUSINESS") {
      return "Sharing Business Level Info";
    } else {
      return "Not Sharing";
    }
  };

  const getSelectedStatusKey = (collabStatus) => {
    if (collabStatus === "SHARED_BASIC") {
      return "SHARED_BASIC";
    } else if (collabStatus === "SHARED_BUSINESS") {
      return "SHARED_BUSINESS";
    } else {
      return "NONE";
    }
  };

  return (
    <Card className="w-full max-w-3xl p-2">
      <CardHeader className="justify-between px-4">
        <div className="flex flex-col items-start mr-3">
          <p className="text-large">Share your profile with Organizations</p>
          <p className="text-small text-default-500">
            This is the profile that will be shared with Organizations that you
            work with
          </p>
        </div>
        {!editingSharing && (
          <Button
            color="primary"
            onClick={() => {
              setEditingSharing(true);
            }}
          >
            Edit
          </Button>
        )}
      </CardHeader>
      <Divider className="my-4" />
      <CardBody className="space-y-2 px-6">
        {Object.entries(sharingStatus ?? {}).map(([orgId, collabStatus]) =>
          editingSharing ? (
            <CellValue
              label={orgId}
              value={
                <Select
                  items={sharingOptions}
                  label="Share info with this orgniazation"
                  placeholder="Select a tier "
                  fullWidth={true}
                  selectedKeys={[getSelectedStatusKey(collabStatus)]}
                  className="min-w-72"
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setSharingStatus((prevStatus) => ({
                      ...prevStatus,
                      [orgId]: getSelectedStatusKey(e.target.value as string),
                    }));
                  }}
                >
                  {(option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  )}
                </Select>
              }
            />
          ) : (
            <CellValue
              label={orgByIds[orgId].name}
              value={getStatusString(collabStatus)}
            />
          )
        )}
      </CardBody>
      {editingSharing && (
        <CardFooter className="mt-4 justify-end gap-2">
          <Button
            radius="full"
            variant="bordered"
            onClick={() => {
              const orgToStatus = orgProfiles.reduce(
                (acc, curr) => {
                  acc[curr.organizationId] = curr.collabStatus ?? "";
                  return acc;
                },
                {} as { [key: string]: string }
              );
              setSharingStatus(orgToStatus);
              setEditingSharing(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            radius="full"
            onClick={() => {
              setEditingSharing(false);
            }}
          >
            {"Save Changes"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
