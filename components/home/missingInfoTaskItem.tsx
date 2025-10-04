import React, { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Divider,
  Form,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import clsx from "clsx";
import { useAuth } from "@clerk/nextjs";
import { dismissReminder } from "@/lib/api/reminders";
import { getTrack, updateTrack } from "@/lib/api/tracks";
import { CollaboratorSingleSelect } from "@/components/collaborator/CollaboratorSingleSelect";
import { CollaboratorSelection } from "@/components/collaborator/types";

type SongTask = {
  id: string;
  userId: string;
  organizationId: string;
  content: {
    songId: string;
    songTitle: string;
    songArtist: string;
  };
  type: "missingInfo";
};

type SongTaskItemProps = {
  task: SongTask;
};

export const MissingInfoTaskItem: React.FC<SongTaskItemProps> = ({ task }) => {
  const { getToken } = useAuth();
  const [isDismissing, setIsDismissing] = React.useState(false);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [isOpen, setIsOpen] = useState(false);

  const queryClient = useQueryClient();

  const [SongQuery] = useQueries({
    queries: [
      {
        queryKey: ["getSingleTrack", task.content.songId],
        queryFn: async () => {
          const token = await getToken({ template: "bard-backend" });
          if (!token) throw new Error("No auth token");
          
          const trackData = await getTrack(task.content.songId, token);
          
          setSongFormData({
            title: trackData.display_name || "",
            artistId: trackData.artist_id || "",
            pitch: trackData.pitch || "",
          });
          
          // Set the selected artist for CollaboratorSingleSelect
          if (trackData.artist_id && trackData.artist) {
            setSelectedArtist({
              id: trackData.artist_id,
              label: trackData.artist.artist_name || trackData.artist.legal_name || "Unknown",
              subtitle: trackData.artist.email || "",
            });
          } else {
            setSelectedArtist(null);
          }

          return trackData;
        },
        enabled: isOpen,
      },
    ],
  });

  const onOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      SongQuery.refetch();
    }
  };

  const [songFormData, setSongFormData] = React.useState({
    title: "",
    artistId: "",
    pitch: "",
  });

  const [selectedArtist, setSelectedArtist] = React.useState<CollaboratorSelection | null>(null);

  const updateSong = useMutation({
    mutationFn: async (trackData: any) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      return updateTrack({
        token,
        trackId: task.content.songId,
        updates: trackData,
      });
    },
    mutationKey: ["updateTrack"],
    onSuccess: async (data) => {
      toast.success("Song Updated!");
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

  const onUpdateSong = (event) => {
    setIsSubmitting(true);
    // Only update the missing info fields: artist_id and pitch
    updateSong.mutate({
      artist_id: songFormData.artistId,
      pitch: songFormData.pitch,
    });
  };

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

  const handleSongFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSongFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSongSelectChange = (name: string, value: string) => {
    setSongFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const content = task.content as {
    songId: string;
    songTitle: string;
    songArtist: string;
    missingFields?: {
      artist_id?: boolean;
      pitch?: boolean;
    };
  };

  const missingFields: string[] = [];
  if (content.missingFields?.artist_id || !selectedArtist) missingFields.push("Primary Artist");
  if (content.missingFields?.pitch || !songFormData.pitch) missingFields.push("Pitch");
  
  const missingFieldsText = missingFields.join(", ");

  return (
    <Card 
      shadow="sm" 
      isPressable={!isOpen}
      onPress={onOpen}
      className={`w-full transition-all duration-200 hover:shadow-md border-l-4 border-sky-400 bg-gradient-to-r from-sky-50 to-transparent cursor-pointer`}
    >
      <CardBody className="p-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 flex-1">
            {/* Music Icon */}
            <div className="rounded-full bg-sky-100 p-2 flex-shrink-0">
              <Icon icon="lucide:music-2" className="h-4 w-4 text-sky-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Main message */}
              <div className="text-base text-default-900">
                Complete some basic info for <span className="font-semibold">"{content.songTitle}"</span>
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
                color="primary"
                variant="solid"
                size="sm"
                startContent={<Icon icon="lucide:edit" className="h-3.5 w-3.5" />}
                className="font-medium ml-3"
              >
                Add Details
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

            <Form className="w-full mt-2">
              <CollaboratorSingleSelect
                label="Artist"
                defaultSelected={selectedArtist}
                setSelected={(collaborator: CollaboratorSelection | null) => {
                  setSelectedArtist(collaborator);
                  handleSongSelectChange("artistId", collaborator?.id || "");
                }}
                title="Select primary artist"
                placeholder="Search for primary artist..."
                useLegalName={false}
                showClearButton={false}
              />


              <Textarea
                label="Pitch / Description"
                name="pitch"
                placeholder="Describe the song concept, mood, or pitch..."
                value={songFormData.pitch}
                onChange={handleSongFormChange}
                variant="bordered"
                minRows={2}
                maxRows={4}
                classNames={{
                  base: "w-full",
                  input: "w-full",
                }}
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
                onPress={onUpdateSong}
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
