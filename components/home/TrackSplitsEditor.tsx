import React from "react";
import {
  Button,
  Form,
  Spinner,
} from "@heroui/react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { SplitsTable } from "./splitsTable";
import type { SplitRow } from "./splitsTable";
import { Collaborator } from "@/lib/api/collaborators";
import { getTrack, updateTrack } from "@/lib/api/tracks";
import { useSplitsState } from "@/hooks/useSplitsState";
import { dismissReminder } from "@/lib/api/reminders";

type TrackSplitsEditorProps = {
  trackId: string;
  onCancel: () => void;
  onSuccess?: () => void;
  taskId?: string; // For auto-dismissing reminders
  includeConfirmationStatus?: boolean; // For ConfirmSplitsTaskItem
  successMessage?: string;
};

export const TrackSplitsEditor: React.FC<TrackSplitsEditorProps> = ({
  trackId,
  onCancel,
  onSuccess,
  taskId,
  includeConfirmationStatus = false,
  successMessage = "Song Updated!",
}) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Use custom hook for split state management
  const {
    splitRows,
    totals,
    handleSplitRowChange,
    addSplitRow,
    removeSplitRow,
    resetSplits,
  } = useSplitsState();

  // Fetch track data
  const { data: trackData, isLoading, isError } = useQuery({
    queryKey: ["getSingleTrack", trackId],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const trackData = await getTrack(trackId, token);
      
      // Extract splits from collaborators in the track response
      const splits: SplitRow[] = [];
      if (trackData.collaborators && trackData.collaborators.length > 0) {
        trackData.collaborators.forEach((collaborator) => {
          splits.push({
            id: collaborator.id,
            collaboratorName: collaborator.artist_name || collaborator.legal_name || "",
            collaboratorEmail: collaborator.email || "",
            songwriting: collaborator.songwriting_split?.toString() || "0",
            publishing: collaborator.publishing_split?.toString() || "0",
            master: collaborator.master_split?.toString() || "0",
          });
        });
      } else {
        // Initialize with empty row if no collaborators
        splits.push({ id: "", collaboratorName: "", collaboratorEmail: "", songwriting: "", publishing: "", master: "" });
      }

      resetSplits(splits);
      return trackData;
    },
  });

  const updateSong = useMutation({
    mutationFn: async (trackData: any) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      return updateTrack({
        token,
        trackId: trackId,
        updates: trackData,
      });
    },
    mutationKey: ["updateTrack"],
    onSuccess: async (data) => {
      toast.success(successMessage);
      setIsSubmitting(false);
      
      // Auto-dismiss the reminder after successful update if taskId provided
      if (taskId) {
        try {
          const token = await getToken({ template: "bard-backend" });
          if (token) {
            await dismissReminder(taskId, token);
          }
        } catch (error) {
          console.error("Failed to auto-dismiss reminder:", error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["songTasks"] });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to update song");
      setIsSubmitting(false);
    },
  });

  const onUpdateSong = () => {
    // Validation
    if (splitRows.some((row) => row.id === "")) {
      toast.error("Please select a collaborator for each split row.");
      return;
    }

    const ids = splitRows.map((row) => row.id);
    const hasDuplicates = ids.some((id, index) => ids.indexOf(id) !== index);
    if (hasDuplicates) {
      toast.error("Please ensure each collaborator is only listed once.");
      return;
    }

    // Prepare collaborators array with splits for backend API
    const collaborators = splitRows.map((row) => ({
      id: row.id,
      songwriting_split: parseFloat(row.songwriting.toString() || "0"),
      publishing_split: parseFloat(row.publishing.toString() || "0"),
      master_split: parseFloat(row.master.toString() || "0"),
    }));

    const updateData: any = { collaborators };
    
    // Add confirmation status if needed (for ConfirmSplitsTaskItem)
    if (includeConfirmationStatus) {
      updateData.splits_confirmation_status = "confirmed";
    }

    setIsSubmitting(true);
    updateSong.mutate(updateData);
  };

  return (
    <Form className="space-y-1">
      <SplitsTable
        splitRows={splitRows}
        onSplitRowChange={handleSplitRowChange}
        onAddRow={addSplitRow}
        onRemoveRow={removeSplitRow}
        totals={totals}
      />
      
      <div className="flex flex-row gap-2 justify-end mt-2 ml-auto">
        <Button
          variant="light"
          onPress={onCancel}
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
    </Form>
  );
};