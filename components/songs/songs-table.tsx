import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Tooltip,
  Chip,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Track, TrackCollaborator } from "@/lib/api/tracks";
import { updateTrack, deleteTrack } from "@/lib/api/tracks";
import { useAuth } from "@clerk/nextjs";
import { AlbumSingleSelect } from "@/components/album/AlbumSingleSelect";
import { DeleteTrackModal } from "./DeleteTrackModal";
import { toast } from "sonner";
import dayjs from "dayjs";

interface SongsTableProps {
  songs: Track[];
  onSongSelect?: (songId: string) => void;
  onUpdateSong?: (songId: string, field: keyof Track, value: string) => void;
  onDeleteSong?: (songId: string) => void;
  uniqueStatuses: string[];
}

export const SongsTable: React.FC<SongsTableProps> = React.memo(({
  songs,
  onSongSelect,
  onUpdateSong,
  onDeleteSong,
  uniqueStatuses,
}) => {
  const { getToken } = useAuth();
  // Track loading states for each song field update
  const [loadingUpdates, setLoadingUpdates] = React.useState<
    Record<string, boolean>
  >({});
  const [updateErrors, setUpdateErrors] = React.useState<
    Record<string, string>
  >({});
  const [deletingTracks, setDeletingTracks] = React.useState<
    Record<string, boolean>
  >({});
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [trackToDelete, setTrackToDelete] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  // Helper function to get album name from track object
  const getAlbumName = React.useCallback((track: Track) => {
    return track.album?.title || "-";
  }, []);

  // Helper function to format dates consistently
  const formatDate = React.useCallback((dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      // Parse as local date to avoid timezone conversion using dayjs
      return dayjs(dateString, 'YYYY-MM-DD').format('MMM D, YYYY');
    } catch (error) {
      return "-";
    }
  }, []);

  // Handle field update with API call simulation
  const handleFieldUpdate = React.useCallback(async (
    songId: string,
    field: keyof Track,
    value: string
  ) => {
    const updateKey = `${songId}-${field}`;

    try {
      // Set loading state for this specific update
      setLoadingUpdates((prev) => ({
        ...prev,
        [updateKey]: true,
      }));

      // Clear any previous errors
      setUpdateErrors((prev) => ({
        ...prev,
        [updateKey]: "",
      }));

      // Get auth token
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      // Use the PUT track endpoint for both album and status updates
      if (field === "album_id") {
        await updateTrack({
          token,
          trackId: songId,
          updates: {
            album_id: value,
          },
        });

        // Pass the album ID value to update the song state
        onUpdateSong?.(songId, field, value);
      } else if (field === "status") {
        await updateTrack({
          token,
          trackId: songId,
          updates: {
            status: value,
          },
        });

        onUpdateSong?.(songId, field, value);
      }

      // If successful, update the local state via the parent component
    } catch (error) {
      // Handle error
      console.error(`Failed to update ${field} for song ${songId}:`, error);
      setUpdateErrors((prev) => ({
        ...prev,
        [updateKey]: `Failed to update ${field}`,
      }));
    } finally {
      // Clear loading state
      setLoadingUpdates((prev) => ({
        ...prev,
        [updateKey]: false,
      }));
    }
  }, [getToken, onUpdateSong]);

  // Handle opening delete modal
  const handleOpenDeleteModal = React.useCallback((songId: string, songName: string) => {
    setTrackToDelete({ id: songId, name: songName });
    setDeleteModalOpen(true);
  }, []);

  // Handle confirming deletion
  const handleConfirmDelete = React.useCallback(async () => {
    if (!trackToDelete) return;

    const { id: songId, name: songName } = trackToDelete;

    try {
      setDeletingTracks((prev) => ({
        ...prev,
        [songId]: true,
      }));

      // Get auth token
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      // Call delete API
      await deleteTrack({
        token,
        trackId: songId,
        onSuccess: (response) => {
          toast.success(
            `"${songName}" deleted successfully. ${response.collaborators_removed} collaborators removed, ${response.external_links_removed} external links removed, ${response.sessions_affected} sessions affected.`
          );
          onDeleteSong?.(songId);
          setDeleteModalOpen(false);
          setTrackToDelete(null);
        },
        onError: (error) => {
          console.error(`Failed to delete track ${songId}:`, error);
          toast.error(`Failed to delete "${songName}"`);
        },
      });
    } catch (error) {
      console.error(`Failed to delete track ${songId}:`, error);
      toast.error(`Failed to delete "${songName}"`);
    } finally {
      setDeletingTracks((prev) => ({
        ...prev,
        [songId]: false,
      }));
    }
  }, [getToken, onDeleteSong, trackToDelete]);

  // Handle closing modal
  const handleCloseDeleteModal = React.useCallback(() => {
    if (trackToDelete && !deletingTracks[trackToDelete.id]) {
      setDeleteModalOpen(false);
      setTrackToDelete(null);
    }
  }, [trackToDelete, deletingTracks]);

  // Render editable cell for album and status
  const renderEditableCell = React.useCallback((
    song: Track,
    field: keyof Track,
    options: { key: string; value: string }[],
    displayValue?: string
  ) => {
    const currentValue = song[field] as string;
    const updateKey = `${song.id}-${field}`;
    const isLoading = loadingUpdates[updateKey];
    const errorMessage = updateErrors[updateKey];

    // Use displayValue if provided, otherwise use the raw value
    const cellDisplay = displayValue || currentValue || "-";

    return (
      <Dropdown>
        <DropdownTrigger>
          <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
            {isLoading ? (
              <Spinner size="sm" color="primary" className="mr-1" />
            ) : errorMessage ? (
              <Tooltip content={errorMessage} color="danger">
                <Icon icon="lucide:alert-circle" className="text-danger mr-1" />
              </Tooltip>
            ) : null}
            <span>{cellDisplay}</span>
            <Icon icon="lucide:chevron-down" className="text-xs" />
          </div>
        </DropdownTrigger>
        <DropdownMenu
          aria-label={`Select ${field}`}
          onAction={(key) => handleFieldUpdate(song.id, field, key.toString())}
          disabledKeys={isLoading ? options.map((option) => option.key) : []}
        >
          {options.map((option) => (
            <DropdownItem
              key={option.key}
              textValue={option.value}
              startContent={
                option.value === currentValue ? (
                  <Icon icon="lucide:check" className="text-primary" />
                ) : null
              }
            >
              {option.value}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    );
  }, [handleFieldUpdate, loadingUpdates, updateErrors]);

  // Render collaborators as chips
  const renderCollaboratorsCell = React.useCallback((collaborators: TrackCollaborator[]) => {
    if (collaborators.length === 0) {
      return <span className="text-default-400">No collaborators</span>;
    }

    // If there are more than 2 collaborators, show 2 and a "+X more" chip
    const displayLimit = 2;
    const displayCollaborators = collaborators.slice(0, displayLimit);
    const remainingCount = collaborators.length - displayLimit;

    return (
      <div
        className="flex flex-wrap gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {displayCollaborators.map((collaborator, index) => (
          <Chip
            key={index}
            size="sm"
            variant="flat"
            color="default"
            className="max-w-[120px]"
          >
            <span className="truncate">{collaborator.artist_name || collaborator.legal_name || ""}</span>
          </Chip>
        ))}

        {remainingCount > 0 && (
          <Popover placement="bottom">
            <PopoverTrigger>
              <Chip
                size="sm"
                variant="flat"
                color="primary"
                className="cursor-pointer"
              >
                +{remainingCount} more
              </Chip>
            </PopoverTrigger>
            <PopoverContent>
              <div className="p-2 max-w-[200px]">
                <p className="text-small font-medium mb-2">All Collaborators</p>
                <div className="space-y-1">
                  {collaborators.map((collaborator, index) => (
                    <div key={index} className="text-small">
                      {index + 1}. {collaborator.artist_name || collaborator.legal_name || ""}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }, []);

  // Render album cell with AlbumSingleSelect
  const renderAlbumCell = React.useCallback((song: Track) => {
    const updateKey = `${song.id}-album_id`;
    const isLoading = loadingUpdates[updateKey];
    const errorMessage = updateErrors[updateKey];

    return (
      <AlbumSingleSelect
        defaultSelected={song.album ? { id: song.album.id, title: song.album.title || "" } : null}
        setSelected={(album) => handleFieldUpdate(song.id, "album_id", album?.id || "")}
        isLoading={isLoading}
        errorMessage={errorMessage}
        disabled={isLoading}
      />
    );
  }, [handleFieldUpdate, loadingUpdates, updateErrors, getAlbumName]);

  // Memoize status options to prevent recreation on each render
  const statusOptions = React.useMemo(() => {
    return uniqueStatuses.map((status) => ({ key: status, value: status }));
  }, [uniqueStatuses]);

  // Render status with appropriate color
  const renderStatusCell = React.useCallback((song: Track) => {
      return renderEditableCell(
        song,
        "status",
        statusOptions
      );
  }, [renderEditableCell, statusOptions]);

  // Render actions dropdown
  const renderActionsCell = React.useCallback((song: Track) => {
    const isDeleting = deletingTracks[song.id];

    return (
      <Dropdown>
        <DropdownTrigger>
          <div className="flex items-center justify-center cursor-pointer hover:text-primary transition-colors p-1">
            {isDeleting ? (
              <Spinner size="sm" color="primary" />
            ) : (
              <Icon icon="lucide:more-horizontal" className="text-lg" />
            )}
          </div>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Track actions"
          disabledKeys={isDeleting ? ["delete"] : []}
        >
          <DropdownItem
            key="delete"
            className="text-danger"
            color="danger"
            startContent={<Icon icon="lucide:trash" className="text-lg" />}
            onPress={() => {
              handleOpenDeleteModal(song.id, song.display_name || "Untitled");
            }}
          >
            Delete Track
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  }, [deletingTracks, handleOpenDeleteModal]);

  return (
    <>
    <Table
      aria-label="Songs table"
      removeWrapper
      selectionMode="single"
      classNames={{
        base: "mb-8 w-full overflow-auto shadow-none",
      }}
      onRowAction={(key) => onSongSelect?.(key.toString())}
    >
      <TableHeader>
        <TableColumn>NAME</TableColumn>
        <TableColumn>ARTIST</TableColumn>
        <TableColumn>ALBUM</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn>COLLABORATORS</TableColumn>
        <TableColumn>STARTED</TableColumn>
        <TableColumn>RELEASE DATE</TableColumn>
        <TableColumn width={50}>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {songs.map((song) => (
          <TableRow key={song.id}>
            <TableCell className="cursor-pointer">{song.display_name}</TableCell>
            <TableCell className="cursor-pointer">{song.artist?.artist_name || song.artist?.legal_name || "-"}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              {renderAlbumCell(song)}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              {renderStatusCell(song)}
            </TableCell>
            <TableCell>{renderCollaboratorsCell(song.collaborators || [])}</TableCell>
            <TableCell className="cursor-pointer">{formatDate(song.project_start_date)}</TableCell>
            <TableCell className="cursor-pointer">{formatDate(song.release_date)}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              {renderActionsCell(song)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {/* Delete confirmation modal */}
    <DeleteTrackModal
      isOpen={deleteModalOpen}
      onClose={handleCloseDeleteModal}
      onConfirm={handleConfirmDelete}
      trackName={trackToDelete?.name || ""}
      isDeleting={trackToDelete ? deletingTracks[trackToDelete.id] : false}
    />
  </>
  );
});
