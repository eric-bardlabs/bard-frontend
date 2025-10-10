import {
  Button,
  Card,
  CardBody,
  Divider,
  Select,
  SelectItem,
  Tooltip,
  User,
  Input,
  Textarea,
  DatePicker,
  Chip,
} from "@heroui/react";
import { PencilIcon, CheckIcon, XIcon } from "lucide-react";
import dayjs from "dayjs";
import { ProfileCard } from "@/components/collaborator/profile-card";
import { useState, useEffect } from "react";
import ShareSong from "@/components/songs/shareSong";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseDate } from "@internationalized/date";
import { useAuth } from "@clerk/nextjs";
import {
  updateTrack,
  TrackCollaborator,
  TrackCollaboratorInput,
} from "@/lib/api/tracks";
import { Track } from "@/lib/api/tracks";
import { STATUSES } from "@/components/songs/types/song";
import { CollaboratorMultiSelect } from "@/components/collaborator/collaboratorMultiSelect";
import { CollaboratorSingleSelect } from "@/components/collaborator/CollaboratorSingleSelect";
import { CollaboratorSelection } from "@/components/collaborator/types";
import { AlbumSingleSelect } from "@/components/album/AlbumSingleSelect";

export const Overview = (props: {
  song: Track;
  onSongUpdated?: () => void;
  showPii?: boolean;
  readonly?: boolean;
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();
  const showPii = props.showPii || false;

  // Helper function to format dates for display (avoiding timezone issues)
  const formatDateForDisplay = (dateString: string | null | undefined) => {
    if (!dateString) return "---";
    try {
      // Parse as local date to avoid timezone conversion
      return dayjs(dateString, "YYYY-MM-DD").format("MMM D, YYYY");
    } catch (error) {
      return "---";
    }
  };

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: props.song?.display_name || "",
    status: props.song?.status || "",
    pitch: props.song?.pitch || "",
    sync: props.song?.sync || "",
    isrc: props.song?.isrc || "",
    ean: props.song?.ean || "",
    upc: props.song?.upc || "",
    sixid: props.song?.sixid || "",
    notes: props.song?.notes || "",
  });

  const [projectStartDate, setProjectStartDate] = useState<any>(
    props.song?.project_start_date
      ? parseDate(props.song.project_start_date.split("T")[0])
      : null
  );
  const [releaseDate, setReleaseDate] = useState<any>(
    props.song?.release_date
      ? parseDate(props.song.release_date.split("T")[0])
      : null
  );

  // Artist and collaborator state for the new components
  const [selectedArtist, setSelectedArtist] =
    useState<CollaboratorSelection | null>(
      props.song?.artist
        ? {
            id: props.song.artist.id || "",
            label:
              props.song.artist.artist_name ||
              props.song.artist.legal_name ||
              "",
            subtitle: props.song.artist.email || "",
          }
        : null
    );

  // Album state for AlbumSingleSelect
  const [selectedAlbum, setSelectedAlbum] = useState<{ id: string; title: string } | null>(
    props.song?.album
      ? {
          id: props.song.album.id,
          title: props.song.album.title || "",
        }
      : null
  );

  const [selectedCollaborators, setSelectedCollaborators] = useState<
    CollaboratorSelection[]
  >(
    props.song?.collaborators
      ?.map((c: TrackCollaborator) => {
        return {
          id: c.id,
          label: c.artist_name || c.legal_name || "",
          subtitle: c.email || "",
        };
      })
      .filter(Boolean) || []
  );

  // Track collaborator roles in edit mode
  const [editCollaboratorRoles, setEditCollaboratorRoles] = useState<
    Record<string, string>
  >(
    props.song?.collaborators?.reduce((acc: any, c: any) => {
      acc[c.id] = c.role || "";
      return acc;
    }, {}) || {}
  );

  useEffect(() => {
    if (!isEditMode) {
      // Reset form data when exiting edit mode
      setEditFormData({
        title: props.song?.display_name || "",
        status: props.song?.status || "",
        pitch: props.song?.pitch || "",
        sync: props.song?.sync || "",
        isrc: props.song?.isrc || "",
        ean: props.song?.ean || "",
        upc: props.song?.upc || "",
        sixid: props.song?.sixid || "",
        notes: props.song?.notes || "",
      });
      setProjectStartDate(
        props.song?.project_start_date
          ? parseDate(props.song.project_start_date.split("T")[0])
          : null
      );
      setReleaseDate(
        props.song?.release_date
          ? parseDate(props.song.release_date.split("T")[0])
          : null
      );
      setSelectedCollaborators(
        props.song?.collaborators?.map((c: TrackCollaborator) => ({
          id: c.id,
          label: c.artist_name || c.legal_name || "",
          subtitle: c.email || "",
        })) || []
      );
      setEditCollaboratorRoles(
        props.song?.collaborators?.reduce((acc: any, c: any) => {
          acc[c.id] = c.role || "";
          return acc;
        }, {}) || {}
      );

      // Reset artist and collaborator state
      setSelectedArtist(
        props.song?.artist_id && props.song?.artist
          ? {
              id: props.song.artist_id,
              label:
                props.song.artist.artist_name ||
                props.song.artist.legal_name ||
                "",
              subtitle: props.song.artist.email || "",
            }
          : null
      );
      
      // Reset album state
      setSelectedAlbum(
        props.song?.album
          ? {
              id: props.song.album.id,
              title: props.song.album.title || "",
            }
          : null
      );
    }
  }, [isEditMode, props.song]);

  const updateCollaboratorRole = useMutation({
    mutationKey: ["updateCollaboratorRole"],
    mutationFn: async (data: { collaboratorId: string; role: string }) => {
      const token = await getToken({ template: "bard-backend" });

      // Get all current collaborators and update only the role for the specific one
      const currentCollaborators = props.song.collaborators || [];
      const collaboratorsWithUpdatedRole = currentCollaborators.map(
        (collab) => ({
          id: collab.id,
          role: collab.id === data.collaboratorId ? data.role : collab.role,
          // Don't send splits - backend will preserve them
        })
      );

      // Use the updateTrack function with only collaborators field
      return updateTrack({
        token: token as string,
        trackId: props.song.id,
        updates: {
          collaborators: collaboratorsWithUpdatedRole,
        },
      });
    },
    onSuccess: (data) => {
      toast.success("Collaborator Credits Updated!");
      props.onSongUpdated?.();
    },
  });

  const updateSong = useMutation({
    mutationFn: async (songData: any) => {
      const token = await getToken({ template: "bard-backend" });

      const formatDate = (date: any) => {
        if (!date) return undefined;
        const d = new Date(date);
        return d.toISOString().split("T")[0];
      };

      return updateTrack({
        token: token as string,
        trackId: props.song.id,
        updates: {
          display_name: songData.displayName,
          artist_id: songData.artistId,
          album_id: songData.albumId,
          status: songData.status,
          pitch: songData.pitch,
          sync: songData.sync,
          isrc: songData.isrc,
          ean: songData.ean,
          upc: songData.upc,
          sixid: songData.sixid,
          notes: songData.notes,
          release_date: formatDate(songData.releaseDate),
          project_start_date: formatDate(songData.projectStartDate),
          collaborators: songData.collaborators,
        },
      });
    },
    mutationKey: ["updateSong"],
    onSuccess: () => {
      toast.success("Song Updated!");
      setIsSubmitting(false);
      setIsEditMode(false);
      props.onSongUpdated?.();
    },
    onError: () => {
      toast.error("Failed to update song");
      setIsSubmitting(false);
    },
  });

  const handleSave = () => {
    setIsSubmitting(true);

    // Prepare collaborators with roles only (don't send splits - backend will preserve them)
    const collaboratorsWithRoles: TrackCollaboratorInput[] =
      selectedCollaborators.map((c) => ({
        id: c.id,
        role: editCollaboratorRoles[c.id] || undefined,
        // Don't send splits - backend preserves them with partial updates
      }));

    // Update song metadata and collaborators together
    updateSong.mutate({
      displayName: editFormData.title,
      artistId: selectedArtist?.id,
      albumId: selectedAlbum?.id,
      status: editFormData.status,
      pitch: editFormData.pitch,
      sync: editFormData.sync,
      isrc: editFormData.isrc,
      ean: editFormData.ean,
      upc: editFormData.upc,
      sixid: editFormData.sixid,
      notes: editFormData.notes,
      releaseDate: releaseDate,
      projectStartDate: projectStartDate,
      collaborators: collaboratorsWithRoles,
    });
  };

  const handleCancel = () => {
    setIsEditMode(false);
  };

  const changeCollaboratorRole = async (
    collaboratorId: string,
    role: string | undefined
  ) => {
    if (!role) return;
    updateCollaboratorRole.mutate({ collaboratorId, role });
  };

  return (
    <Card className="w-full h-full">
      <CardBody className="p-6">
        {/* Header Section */}
        <div className="flex flex-row justify-between items-start w-full mb-6">
          <div className="flex flex-col gap-2 flex-1">
            {isEditMode ? (
              <>
                <Input
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  variant="bordered"
                  label="Song Title"
                  size="lg"
                  className="max-w-md"
                />
                <div className="max-w-md">
                  <CollaboratorSingleSelect
                    label="Primary Artist"
                    defaultSelected={selectedArtist}
                    setSelected={(collaborator) => {
                      setSelectedArtist(collaborator);
                    }}
                    title="Select primary artist"
                    placeholder="Search for primary artist..."
                    useLegalName={false}
                    showClearButton={true}
                  />
                </div>
                <Select
                  label="Status"
                  selectedKeys={
                    editFormData.status ? [editFormData.status] : []
                  }
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  variant="bordered"
                  className="max-w-md"
                >
                  {STATUSES.map((status) => (
                    <SelectItem key={status}>{status}</SelectItem>
                  ))}
                </Select>
              </>
            ) : (
              <>
                <p className="font-bold md:text-3xl text-xl max-w-full text-nowrap overflow-hidden text-ellipsis">
                  {props.song.display_name}
                </p>
                <p className="font-semibold text-xl text-muted-foreground">
                  {props.song.artist?.artist_name ||
                    props.song.artist?.legal_name ||
                    "---"}
                </p>
                {props.song.status && (
                  <Chip color="default" size="md">
                    {props.song.status}
                  </Chip>
                )}
              </>
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
                    Edit Overview
                  </Button>
                  <ShareSong song={props.song} />
                </>
              )}
            </div>
          )}
        </div>

        <Divider className="my-4" />

        {/* Details Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - General Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-700 mb-3">
              General Information
            </h3>

            {isEditMode ? (
              <>
                <AlbumSingleSelect
                  defaultSelected={selectedAlbum}
                  setSelected={(album) => {
                    setSelectedAlbum(album);
                  }}
                  variant="form"
                  label="Album"
                  placeholder="Select an album..."
                />
                <Textarea
                  label="Pitch"
                  value={editFormData.pitch}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, pitch: e.target.value })
                  }
                  variant="bordered"
                  minRows={2}
                  maxRows={4}
                />
                <Input
                  label="Sync"
                  value={editFormData.sync}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, sync: e.target.value })
                  }
                  variant="bordered"
                />
                <DatePicker
                  label="Project Start Date"
                  value={projectStartDate}
                  onChange={setProjectStartDate}
                  variant="bordered"
                />
                <DatePicker
                  label="Release Date"
                  value={releaseDate}
                  onChange={setReleaseDate}
                  variant="bordered"
                />
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-default-500">Album</p>
                  <p className="text-sm">{props.song.album?.title || "---"}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Pitch</p>
                  <p className="text-sm">{props.song.pitch || "---"}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Sync</p>
                  <p className="text-sm">{props.song.sync || "---"}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Start Date</p>
                  <p className="text-sm">
                    {formatDateForDisplay(props.song.project_start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Release Date</p>
                  <p className="text-sm">
                    {formatDateForDisplay(props.song.release_date)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Release Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-default-700">
                Release Information
              </h3>
              {/* <ReleaseStatus releaseDate={props.song.release_date ? new Date(props.song.release_date) : undefined} /> */}
            </div>

            {isEditMode ? (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="ISRC"
                  value={editFormData.isrc}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, isrc: e.target.value })
                  }
                  variant="bordered"
                  size="sm"
                />
                <Input
                  label="EAN"
                  value={editFormData.ean}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, ean: e.target.value })
                  }
                  variant="bordered"
                  size="sm"
                />
                <Input
                  label="UPC"
                  value={editFormData.upc}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, upc: e.target.value })
                  }
                  variant="bordered"
                  size="sm"
                />
                <Input
                  label="SIXID"
                  value={editFormData.sixid}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, sixid: e.target.value })
                  }
                  variant="bordered"
                  size="sm"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-default-500">ISRC</p>
                  <p className="text-sm">{props.song.isrc || "---"}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">EAN</p>
                  <p className="text-sm">{props.song.ean || "---"}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">UPC</p>
                  <p className="text-sm">{props.song.upc || "---"}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">SIXID</p>
                  <p className="text-sm">{props.song.sixid || "---"}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Divider className="my-4" />

        {/* Collaborators Section */}
        <div>
          <h3 className="text-sm font-semibold text-default-700 mb-3">
            Collaborators
          </h3>

          {isEditMode ? (
            <div className="mb-4 flex justify-start">
              <div className="w-auto min-w-[300px] max-w-[500px]">
                <CollaboratorMultiSelect
                  defaultSelected={selectedCollaborators}
                  setSelected={(value) => {
                    setSelectedCollaborators(value);
                  }}
                  title="Select Collaborators"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            {(isEditMode
              ? selectedCollaborators.map((c) => {
                  return {
                    id: c.id,
                    role: editCollaboratorRoles[c.id] || "",
                    artist_name: c.label,
                    email: c.subtitle,
                  };
                })
              : props.song.collaborators ?? []
            ).map((collaborator: TrackCollaborator) => {
              return (
                <div
                  className="flex flex-row justify-between items-center bg-default-50 rounded-lg p-3"
                  key={collaborator.id}
                >
                  <Tooltip
                    content={
                      collaborator.collaborator_profile ? (
                        <div className="min-w-[400px]">
                          <ProfileCard
                            myProfile={collaborator.collaborator_profile}
                            showEmail={showPii}
                            showRelationships={false}
                            isPopOver={true}
                            headerOverride={
                              (collaborator.artist_name ||
                                collaborator.legal_name) + "'s Profile"
                            }
                            subHeaderOverride={""}
                          />
                        </div>
                      ) : null
                    }
                    placement="left"
                    delay={500}
                    isDisabled={!collaborator.collaborator_profile}
                  >
                    <User
                      avatarProps={{
                        radius: "lg",
                        src: "",
                      }}
                      name={collaborator.artist_name || collaborator.legal_name}
                    />
                  </Tooltip>

                  <Select
                    className="max-w-xs"
                    label="Credits"
                    variant="bordered"
                    selectedKeys={
                      isEditMode
                        ? editCollaboratorRoles[collaborator.id]
                          ? [editCollaboratorRoles[collaborator.id]]
                          : []
                        : collaborator.role
                          ? [collaborator.role]
                          : []
                    }
                    onSelectionChange={(value) => {
                      if (isEditMode) {
                        // In edit mode, update local state
                        setEditCollaboratorRoles((prev) => ({
                          ...prev,
                          [collaborator.id]: value.currentKey || "",
                        }));
                      } else {
                        // In view mode, update immediately using PUT track endpoint
                        if (value.currentKey) {
                          changeCollaboratorRole(
                            collaborator.id,
                            value.currentKey
                          );
                        }
                      }
                    }}
                    size="sm"
                    placeholder="Select a role"
                    isDisabled={props.readonly}
                  >
                    <SelectItem key="performance">Performance</SelectItem>
                    <SelectItem key="writing">Writing</SelectItem>
                    <SelectItem key="production">Production</SelectItem>
                    <SelectItem key="distribution">Distribution</SelectItem>
                    <SelectItem key="publishing">Publishing</SelectItem>
                    <SelectItem key="other">Other</SelectItem>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes Section */}
        <Divider className="my-6" />
        <div className="w-full">
          <h3 className="text-lg font-medium mb-4">Notes</h3>
          {isEditMode ? (
            <Textarea
              value={editFormData.notes}
              onChange={(e) =>
                setEditFormData({ ...editFormData, notes: e.target.value })
              }
              variant="bordered"
              placeholder="Add notes about this song..."
              minRows={3}
              maxRows={8}
              className="w-full"
            />
          ) : (
            <div className="min-h-[80px] p-3 bg-default-50 rounded-lg">
              <p className="text-default-600 whitespace-pre-wrap">
                {props.song?.notes || "No notes added yet"}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
