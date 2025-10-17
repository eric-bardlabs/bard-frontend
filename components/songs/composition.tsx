import { PencilIcon, CheckIcon, XIcon } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import ShareSong from "@/components/songs/shareSong";
import { useMemo, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Track, TrackCollaborator, TrackCollaboratorInput, updateTrack } from "@/lib/api/tracks";
import { useAuth } from "@clerk/nextjs";
import { SplitsTable } from "@/components/home/splitsTable";
import { SplitsDisplay } from "@/components/home/splitsDisplay";
import { useSplitsState } from "@/hooks/useSplitsState";
import { MASTER_FEE_STATUSES } from "@/components/songs/types/song";

export const Composition = (props: {
  song: Track;
  onSongUpdated?: () => void;
  showPii?: boolean;
  readonly?: boolean;
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();
  
  // Initialize edit state
  const [editFormData, setEditFormData] = useState({
    registrationStatus: props.song?.registration_status || "",
    masterFeeStatus: props.song?.master_fee_status || "",
    masterFeeAmount: props.song?.master_fee_amount?.toString() || "",
  });

  // Initialize splits state from song collaborators
  const initialSplits = useMemo(() => {
    if (props.song?.collaborators && props.song.collaborators.length > 0) {
      return props.song.collaborators.map((collab: TrackCollaborator) => ({
        id: collab.id,
        collaboratorName: collab.legal_name || collab.artist_name || "",
        collaboratorEmail: collab.email || "",
        songwriting: collab.songwriting_split?.toString() || "",
        publishing: collab.publishing_split?.toString() || "",
        master: collab.master_split?.toString() || "",
      }));
    }
    return [{ id: "", collaboratorName: "", collaboratorEmail: "", songwriting: "", publishing: "", master: "" }];
  }, [props.song?.collaborators]);

  // Use the shared splits state hook
  const {
    splitRows,
    totals,
    handleSplitRowChange,
    addSplitRow,
    removeSplitRow,
    resetSplits,
  } = useSplitsState(initialSplits);

  // Reset form when exiting edit mode
  useEffect(() => {
    if (!isEditMode) {
      setEditFormData({
        registrationStatus: props.song?.registration_status || "",
        masterFeeStatus: props.song?.master_fee_status || "",
        masterFeeAmount: props.song?.master_fee_amount?.toString() || "",
      });
      resetSplits(initialSplits);
    }
  }, [isEditMode, props.song, initialSplits, resetSplits]);


  // Update mutation
  const updateSong = useMutation({
    mutationFn: async (data: {
      collaborators: TrackCollaboratorInput[];
      registration_status?: string;
      master_fee_status?: string;
      master_fee_amount?: number;
    }) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      return updateTrack({
        token,
        trackId: props.song.id,
        updates: {
          collaborators: data.collaborators,
          registration_status: data.registration_status,
          master_fee_status: data.master_fee_status,
          master_fee_amount: data.master_fee_amount,
        },
      });
    },
    mutationKey: ["updateSong"],
    onSuccess: () => {
      toast.success("Composition Updated!");
      setIsSubmitting(false);
      setIsEditMode(false);
      props.onSongUpdated?.();
    },
    onError: () => {
      toast.error("Failed to update composition");
      setIsSubmitting(false);
    },
  });

  const handleSave = () => {
    // Validate splits
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

    setIsSubmitting(true);
    
    // Convert splits to collaborators format for backend
    // Only send splits, roles will be preserved by the backend
    const collaboratorsWithSplits: TrackCollaboratorInput[] = splitRows
      .filter(row => row.id && row.collaboratorName) // Only include rows with selected collaborators
      .map((split) => ({
        id: split.id,
        // Only send splits - roles will be preserved by the backend
        songwriting_split: parseFloat(split.songwriting?.toString() || "0") || 0,
        publishing_split: parseFloat(split.publishing?.toString() || "0") || 0,
        master_split: parseFloat(split.master?.toString() || "0") || 0,
      }));

    updateSong.mutate({
      collaborators: collaboratorsWithSplits,
      registration_status: editFormData.registrationStatus,
      master_fee_status: editFormData.masterFeeStatus,
      master_fee_amount: editFormData.masterFeeAmount ? parseFloat(editFormData.masterFeeAmount) : undefined,
    });
  };

  const handleCancel = () => {
    setIsEditMode(false);
  };

  return (
    <Card className="w-full">
      <CardBody className="p-6">
        {/* Header Section */}
        <div className="flex flex-row justify-between items-start w-full mb-6">
          <div className="flex flex-col gap-2 flex-1">
              <p className="font-bold md:text-3xl text-xl max-w-full text-nowrap overflow-hidden text-ellipsis">
                {props.song.display_name}
              </p>
              <p className="font-semibold text-xl text-muted-foreground">
                {props.song.artist?.artist_name || props.song.artist?.legal_name || "---"}
              </p>
            {props.song.status && (
              <Chip color="default" size="md">
                {props.song.status}
              </Chip>
            )}
          </div>
          {!props.readonly && (
              <div className="flex flex-row gap-2 items-center">
                {isEditMode ? (
                  <>
                    <Button
                      startContent={<CheckIcon size={18} />}
                      onPress={handleSave}
                      color="primary"
                      isLoading={isSubmitting}
                    >
                      Save
                    </Button>
                    <Button
                      startContent={<XIcon size={18} />}
                      onPress={handleCancel}
                      variant="light"
                      isDisabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      startContent={<PencilIcon size={18} />}
                      onPress={() => setIsEditMode(true)}
                      variant="light"
                    >
                      Edit Composition
                    </Button>
                    <ShareSong song={props.song} />
                  </>
                )}
            </div>
          )}
        </div>

        <Divider className="my-4" />

        {/* Status and Fee Information */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-default-700">Registration</h3>
            {isEditMode ? (
              <Select
                label="Registration Status"
                selectedKeys={editFormData.registrationStatus ? [editFormData.registrationStatus] : []}
                onChange={(e) => setEditFormData({ ...editFormData, registrationStatus: e.target.value })}
                variant="bordered"
                size="sm"
              >
                {["Registered", "Songtrust", "Not Registered"].map((status) => (
                  <SelectItem key={status}>{status}</SelectItem>
                ))}
              </Select>
            ) : (
              <p className="text-lg font-medium">
                {props.song.registration_status || "---"}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-default-700">Master Fee Status</h3>
            {isEditMode ? (
              <Select
                label="Fee Status"
                selectedKeys={editFormData.masterFeeStatus ? [editFormData.masterFeeStatus] : []}
                onChange={(e) => setEditFormData({ ...editFormData, masterFeeStatus: e.target.value })}
                variant="bordered"
                size="sm"
              >
                {MASTER_FEE_STATUSES.map((status) => (
                  <SelectItem key={status}>{status}</SelectItem>
                ))}
              </Select>
            ) : (
              <p className="text-lg font-medium">
                {props.song.master_fee_status || "---"}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-default-700">Master Fee Amount</h3>
            {isEditMode ? (
              <Input
                label="Amount"
                value={editFormData.masterFeeAmount}
                onChange={(e) => {
                  const regex = /^\d*\.?\d{0,2}$/;
                  if (regex.test(e.target.value)) {
                    setEditFormData({ ...editFormData, masterFeeAmount: e.target.value });
                  }
                }}
                variant="bordered"
                size="sm"
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">$</span>
                  </div>
                }
              />
            ) : (
              <p className="text-lg font-medium">
                {props.song.master_fee_amount ? `$${props.song.master_fee_amount}` : "---"}
              </p>
            )}
          </div>
        </div>

        <Divider className="my-4" />

        {/* Splits Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-default-700">Ownership Splits</h3>
          </div>

          {isEditMode ? (
            <SplitsTable
              splitRows={splitRows}
              onSplitRowChange={handleSplitRowChange}
              onAddRow={addSplitRow}
              onRemoveRow={removeSplitRow}
              totals={totals}
            />
          ) : (
            <SplitsDisplay
              splitRows={splitRows}
              totals={totals}
            />
          )}
        </div>
      </CardBody>
    </Card>
  );
};