import React, { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Divider,
  Form,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import clsx from "clsx";
import { useAuth } from "@clerk/nextjs";
import { Collaborator } from "@/lib/api/collaborators";
import { dismissReminder } from "@/lib/api/reminders";
import { TrackSplitsEditor } from "./TrackSplitsEditor";

type SongTask = {
  id: string;
  userId: string;
  organizationId: string;
  content: {
    songId: string;
    songTitle: string;
    songArtist: string;
  };
  type: "missingSplits";
};

type SongTaskItemProps = {
  task: SongTask;
};

export const MissingSplitsTaskItem: React.FC<SongTaskItemProps> = ({
  task,
}) => {
  const { getToken } = useAuth();
  const [isDismissing, setIsDismissing] = React.useState(false);
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);

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

  const content = task.content as {
    songId: string;
    songTitle: string;
    songArtist: string;
    missingFields?: {
      master_splits?: boolean;
      publisher_splits?: boolean;
      song_writer_splits?: boolean;
    };
  };


  const missingFields: string[] = [];
  if (content.missingFields?.master_splits) missingFields.push("Master Splits");
  if (content.missingFields?.publisher_splits) missingFields.push("Publishing Splits");
  if (content.missingFields?.song_writer_splits) missingFields.push("Songwriting Splits");
  if (missingFields.length === 0) missingFields.push("Revenue Splits");

  const missingFieldsText = missingFields.join(", ");

  return (
    <Card 
      shadow="sm" 
      isPressable={!isOpen}
      onPress={() => setIsOpen(true)}
      className={`w-full transition-all duration-200 hover:shadow-md border-l-4 border-orange-400 bg-gradient-to-r from-orange-50 to-transparent cursor-pointer`}
    >
      <CardBody className="p-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 flex-1">
            {/* Splits Icon */}
            <div className="rounded-full bg-orange-100 p-2 flex-shrink-0">
              <Icon icon="lucide:pie-chart" className="h-4 w-4 text-orange-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Main message */}
              <div className="text-base text-default-900">
              Add splits for <span className="font-semibold">"{content.songTitle}"</span>
              </div>
              
              {/* Missing fields as subtitle */}
              <div className="text-sm text-default-500 mt-0.5">
                Missing: {missingFieldsText}
              </div>
            </div>

            {/* CTA Button close to text */}
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Button 
                onPress={() => setIsOpen(true)} 
                color="warning"
                variant="solid"
                size="sm"
                startContent={<Icon icon="lucide:percent" className="h-3.5 w-3.5" />}
                className="font-medium ml-3"
              >
                Add Splits
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
          <div onClick={(e) => e.stopPropagation()}>
            <Divider className={clsx("my-1")} />
            
            <TrackSplitsEditor
              trackId={task.content.songId}
              onCancel={() => setIsOpen(false)}
              onSuccess={() => setIsOpen(false)}
              taskId={task.id}
              successMessage="Song Updated!"
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
};
