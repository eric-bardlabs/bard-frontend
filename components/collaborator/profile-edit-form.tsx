import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useOrganization } from "@clerk/nextjs";
import { Collaborator } from "@/lib/api/collaborators";
import {
  CardFooter,
  Button,
  Input,
  Textarea,
} from "@heroui/react";

type FormType = {
  artistName: string;
  region: string;
  proId: string;
  pro: string;
  profileLink: string;
  bio: string;
};

const ProfileEditForm = ({
  myProfile,
  onSuccess,
  onCancel,
}: {
  myProfile: Collaborator;
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const organizationId = organization?.id;

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

  useEffect(() => {
    reset({
      artistName: myProfile.artist_name ?? "",
      region: myProfile.region ?? "",
      proId: myProfile.pro_id ?? "",
      pro: myProfile.pro ?? "",
      profileLink: myProfile.profile_link ?? "",
      bio: myProfile.bio ?? "",
    });
  }, [myProfile]);

  const { handleSubmit, getValues, register, setValue, watch, reset } =
    useForm<FormType>({
      defaultValues: useMemo(() => {
        return {
          artistName: myProfile.artist_name ?? "",
          region: myProfile.region ?? "",
          proId: myProfile.pro_id ?? "",
          pro: myProfile.pro ?? "",
          profileLink: myProfile.profile_link ?? "",
          bio: myProfile.bio ?? "",
        };
      }, [myProfile]),
    });

  const updateCollaboratorProfile = useMutation({
    mutationFn: async (data: FormType) => {
      return axios
        .put(`/api/collaborators/myProfile/${myProfile.id}`, {
          ...data,
        })
        .then((res) => res.data);
    },
    mutationKey: ["updateCollaboratorMyProfile"],
    onSuccess: (data) => {
      toast.success("Collaborator Profile Updated");
      queryClient.invalidateQueries({
        queryKey: ["getAllCollaboratorProfiles"],
      });
      onSuccess?.();
    },
  });

  const onSubmit = (data: FormType) => {
    updateCollaboratorProfile.mutate(data);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
      <CellValue
        label="Artist Name"
        value={
          <Input
            label="Enter Artist Name"
            placeholder="Enter Artist Name"
            labelPlacement="inside"
            fullWidth={true}
            //   startContent={<Icon icon="iconamoon:music-artist-bold" />}
            {...register("artistName")}
          />
        }
      />
      <CellValue
        label="Region"
        value={
          <Input
            label="Region"
            placeholder="Enter Region"
            labelPlacement="inside"
            fullWidth={true}
            //   startContent={<Icon icon="iconamoon:music-artist-bold" />}
            {...register("region")}
          />
        }
      />
      <CellValue
        label="PRO"
        value={
          <Input
            label="PRO"
            placeholder="Enter PRO"
            labelPlacement="inside"
            fullWidth={true}
            //   startContent={<Icon icon="iconamoon:music-artist-bold" />}
            {...register("pro")}
          />
        }
      />
      <CellValue
        label="PRO ID"
        value={
          <Input
            label="PRO ID"
            placeholder="Enter PRO ID"
            labelPlacement="inside"
            fullWidth={true}
            //   startContent={<Icon icon="iconamoon:music-artist-bold" />}
            {...register("proId")}
          />
        }
      />
      <CellValue
        label="Profile Link"
        value={
          <Input
            label="Profile Link"
            placeholder="Enter Profile Link"
            labelPlacement="inside"
            fullWidth={true}
            //   startContent={<Icon icon="iconamoon:music-artist-bold" />}
            //   className="text-small text-default-500"
            {...register("profileLink")}
          />
        }
      />
      <CellValue
        label="Bio"
        value={
          <Textarea
            label="Enter Short Bio"
            labelPlacement="inside"
            fullWidth={true}
            //   startContent={<Icon icon="iconamoon:music-artist-bold" />}
            //   className="text-small text-default-500"
            {...register("bio")}
          />
        }
      />
      <CardFooter className="mt-4 justify-end gap-2">
        <Button radius="full" variant="bordered" onClick={onCancel}>
          Cancel
        </Button>
        <Button  type="submit" color="primary" radius="full">
        {myProfile ? "Save Changes" : "Create"}
        </Button>
      </CardFooter>
    </form>
  );
};

export default ProfileEditForm;
