import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Tooltip,
  Chip,
  Button,
  Form,
  Divider,
  Input,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import clsx from "clsx";
import { useAuth } from "@clerk/nextjs";
import { dismissReminder } from "@/lib/api/reminders";

type SongTask = {
  id: string;
  userId: string;
  organizationId: string;
  content: {
    collaboratorProfileId: string;
    artistName: string;
    legalName: string;
    pro: string;
    proId: string;
  };
  type: "missingCollaboratorInfo";
};

type SongTaskItemProps = {
  task: SongTask;
};

export const MissingCollaboratorInfoTaskItem: React.FC<SongTaskItemProps> = ({
  task,
}) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [collaboratorData, setCollaboratorData] = useState({
    legalName: "",
    artistName: "",
    pro: "",
    proId: "",
  });

  const collaboratorProfileQuery = useQuery({
    queryKey: ["collaboratorProfile", task.content.collaboratorProfileId],
    queryFn: () =>
      axios
        .get(`/api/collaborators/${task.content.collaboratorProfileId}`)
        .then((res) => res.data),
    enabled: isOpen, // Only fetch when the modal is open
  });

  useEffect(() => {
    if (collaboratorProfileQuery.data) {
      const profile = collaboratorProfileQuery.data;
      setCollaboratorData({
        legalName: profile.legalName || "",
        artistName: profile.artistName || "",
        pro: profile.pro || "",
        proId: profile.proId || "",
      });
    }
  }, [collaboratorProfileQuery.data]);

  const onOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      collaboratorProfileQuery.refetch();
    }
  };

  const handleCollaboratorDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCollaboratorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateCollaborator = useMutation({
    mutationFn: async () => {
      return axios
        .put(`/api/collaborators/${task.content.collaboratorProfileId}`, {
          ...collaboratorData,
        })
        .then((res) => res.data);
    },
    mutationKey: ["updateCollaborator"],
    onSuccess: async (data) => {
      toast.success("Collaborator Updated");
      setIsSubmitting(false);
      // Auto-dismiss the reminder after successful update
      try {
        const token = await getToken({ template: "bard-backend" });
        if (token) {
          await dismissReminder(task.id, token);
        }
      } catch (error) {
        console.error("Failed to auto-dismiss reminder:", error);
      }
      queryClient.invalidateQueries({ queryKey: ["songTasks"] });
      setIsOpen(false);
    },
  });

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("Failed to get authentication token");
      }
      await dismissReminder(task.id, token);
      queryClient.invalidateQueries({ queryKey: ["songTasks"] });
      toast.success("Task dismissed");
    } catch (error) {
      console.error("Failed to dismiss task:", error);
      toast.error("Failed to dismiss task");
    } finally {
      setIsDismissing(false);
    }
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    updateCollaborator.mutate();
  };

  const missingFields: string[] = [];
  if (!task.content.artistName) missingFields.push("Artist Name");
  if (!task.content.legalName) missingFields.push("Legal Name");
  if (!task.content.pro || task.content.pro === "") missingFields.push("PRO");
  if (!task.content.proId || task.content.proId === "") missingFields.push("PRO ID");

  const displayName = task.content.artistName || task.content.legalName || "Unknown Collaborator";
  const missingFieldsText = missingFields.join(", ");

  return (
    <Card 
      shadow="sm" 
      isPressable={!isOpen}
      onPress={onOpen}
      className={`w-full transition-all duration-200 hover:shadow-md border-l-4 border-purple-400 bg-gradient-to-r from-purple-50 to-transparent cursor-pointer`}
    >
      <CardBody className="p-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 flex-1">
            {/* User Avatar/Icon */}
            <div className="rounded-full bg-purple-100 p-2 flex-shrink-0">
              <Icon icon="lucide:user" className="h-4 w-4 text-purple-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Main message */}
              <div className="text-base text-default-900">
                We need some information about <span className="font-semibold">{displayName}</span>
              </div>
              
              {/* Missing fields as subtitle */}
              <div className="text-sm text-default-500 mt-0.5">
                Missing: {missingFieldsText}
              </div>
            </div>

            {/* CTA Button close to text */}
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Button 
                onPress={onOpen} 
                color="secondary"
                variant="solid"
                size="sm"
                startContent={<Icon icon="lucide:user-plus" className="h-3.5 w-3.5" />}
                className="font-medium ml-3"
              >
                Add Info
              </Button>
            </div>
          </div>

          {/* Dismiss/Close button on far right */}
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 ml-2">
            <Button
              size="sm"
              variant="light"
              color="default"
              onPress={isOpen ? () => setIsOpen(false) : handleDismiss}
              isLoading={isDismissing}
              className="text-default-500 hover:text-default-700 underline-offset-2 hover:underline"
            >
              {isOpen ? "Close" : "Dismiss"}
            </Button>
          </div>
        </div>

        {isOpen && (
          <>
            <Divider className={clsx("my-1")} />

            <Form className="space-y-1">
              <Input
                label="Legal Name"
                name="legalName"
                placeholder="Enter legal name"
                value={collaboratorData.legalName}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
              <Input
                label="Artist Name"
                name="artistName"
                placeholder="Enter Artist name"
                value={collaboratorData.artistName}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
              <Input
                label="Pro"
                name="pro"
                placeholder="Enter pro"
                value={collaboratorData.pro}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
              <Input
                label="Pro ID"
                name="proId"
                placeholder="Enter pro ID"
                value={collaboratorData.proId}
                onChange={handleCollaboratorDataChange}
                className="w-full"
              />
            </Form>
            <div className="flex flex-row gap-2 justify-end mt-2">
              <Button
                variant="light"
                onPress={() => setIsOpen(false)}
                className="w-fit"
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                isLoading={isSubmitting}
                onPress={onSubmit}
                className="w-fit"
              >
                Confirm
              </Button>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};
