import React from "react";
import { Button, Checkbox, Tooltip } from "@heroui/react";
import { SplitType } from "@/components/types/onboarding";
import { SplitsTable } from "@/components/home/splitsTable";
import { SplitsView } from "./splits-view";
import { updateTrack } from "@/lib/api/tracks";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Track, TrackCollaborator } from "@/lib/api/tracks";
import { Collaborator } from "@/lib/api/collaborators";
import { useSplitsState } from "@/hooks/useSplitsState";

interface SplitsEditorProps {
  song: Track;
  refetchTrack: () => void;
}

export const SplitsEditor: React.FC<SplitsEditorProps> = ({
  song,
  refetchTrack,
}) => {
  const { getToken } = useAuth();
  
  // Use shared splits state hook
  const {
    splitRows,
    totals,
    handleSplitRowChange,
    addSplitRow,
    removeSplitRow,
    resetSplits,
  } = useSplitsState();

  // Local state for UI
  const [hasEdited, setHasEdited] = React.useState(false);
  const [isFromCSV, setIsFromCSV] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Initialize splits when editing starts
  React.useEffect(() => {
    if (isEditing && song) {
      const splits = (song.collaborators ?? []).map((collaborator: TrackCollaborator) => ({
        id: collaborator.id,
        collaboratorName: collaborator.artist_name || collaborator.legal_name || "",
        collaboratorEmail: collaborator.email || "",
        songwriting: collaborator.songwriting_split?.toString() || "0",
        publishing: collaborator.publishing_split?.toString() || "0",
        master: collaborator.master_split?.toString() || "0",
      }));

      // If no splits exist, start with an empty row
      if (splits.length === 0) {
        splits.push({
          id: "",
          collaboratorName: "",
          collaboratorEmail: "",
          songwriting: "0",
          publishing: "0",
          master: "0",
        });
      }

      resetSplits(splits);
      setHasEdited(false);
    }
  }, [isEditing, song, resetSplits]);

  // Get splits for view mode
  const getViewSplits = () => {
    const splits = (song.collaborators ?? []).map((collaborator: TrackCollaborator) => ({
      id: collaborator.id,
      name: collaborator.legal_name || collaborator.artist_name || collaborator.email || "",
      songwriting: collaborator.songwriting_split || 0,
      publishing: collaborator.publishing_split || 0,
      master: collaborator.master_split || 0,
    }));

    return splits;
  };

  // Wrap the hook's handlers to track edit state
  const handleSplitRowChangeWithEdit = (
    index: number,
    field: string,
    value: string | number | { id: string; name: string; email: string }
  ) => {
    handleSplitRowChange(index, field, value);
    setHasEdited(true);
  };

  const handleRemoveRowWithEdit = (index: number) => {
    removeSplitRow(index);
    setHasEdited(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Filter out empty rows and transform to expected format
      const validSplits = splitRows
        .filter((split) => split.id && split.id.trim() !== "")
        .map((split) => {
          return {
            id: split.id,
            name: split.collaboratorName,
            songwriting: split.songwriting,
            publishing: split.publishing,
            master: split.master,
          };
        });

      // Transform splits into the format expected by the backend
      const collaboratorsData = validSplits.map(split => ({
        id: split.id,
        songwriting_split: parseFloat(split.songwriting?.toString() || "0"),
        master_split: parseFloat(split.master?.toString() || "0"),
        publishing_split: parseFloat(split.publishing?.toString() || "0"),
      }));

      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      // Call the backend API to update track splits
      await updateTrack({
        token,
        trackId: song.id,
        updates: {
          collaborators: collaboratorsData,
        },
        onSuccess: () => {
          toast.success("Splits updated successfully");
          refetchTrack();
          setHasEdited(false);
          setIsFromCSV(false);
          setIsEditing(false);
        },
        onError: (error) => {
          console.error("Failed to update splits:", error);
          toast.error("Failed to update splits");
        }
      });
    } catch (error) {
      console.error("Error saving splits:", error);
      toast.error("Failed to save splits");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    resetSplits([]);
    setHasEdited(false);
    setIsFromCSV(false);
    setIsEditing(false);
  };

  // Check if save is valid
  const canSave = () => {
    const validSplits = splitRows.filter(
      (split) => split.id && split.id.trim() !== ""
    );

    // Check for duplicates
    const ids = validSplits.map((s) => s.id);
    const uniqueIds = new Set(ids);

    return validSplits.length > 0 && ids.length === uniqueIds.size;
  };


  if (isEditing) {
    return (
      <div className="flex flex-col gap-4">
        <SplitsTable
          splitRows={splitRows}
          onSplitRowChange={handleSplitRowChangeWithEdit}
          onAddRow={addSplitRow}
          onRemoveRow={handleRemoveRowWithEdit}
          totals={totals}
        />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {hasEdited && (
              <Checkbox
                size="sm"
                isSelected={isFromCSV}
                onValueChange={setIsFromCSV}
              >
                <span className="text-sm">
                  Are these splits from an uploaded CSV?
                </span>
              </Checkbox>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={handleCancel}
              isDisabled={isSaving}
            >
              Cancel
            </Button>
            <Tooltip
              content={
                !canSave()
                  ? splitRows.filter((s) => s.id).length === 0
                    ? "At least one collaborator must be selected"
                    : "Duplicate collaborators detected"
                  : ""
              }
              isDisabled={canSave()}
            >
              <Button
                size="sm"
                color="primary"
                onPress={handleSave}
                isDisabled={!canSave() || isSaving}
                isLoading={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SplitsView
      splits={getViewSplits()}
      totals={totals}
      onEditClick={() => setIsEditing(true)}
    />
  );
};
