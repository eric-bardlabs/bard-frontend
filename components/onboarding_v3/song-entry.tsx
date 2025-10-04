import React, { useMemo } from "react";
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  SortDescriptor,
  Tooltip,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { EditableCell } from "./editable-cell";
import { SimpleNewSongModal } from "@/components/songs/simple-new-song-modal";
import { STATUSES } from "@/components/songs/types/song";
import { updateTrack, deleteTrack, fetchTracks } from "@/lib/api/tracks";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { toast } from "sonner";
import { Album } from "@/lib/api/albums";
import { Collaborator } from "@/lib/api/collaborators";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AlbumSingleSelect } from "@/components/album/AlbumSingleSelect";
import { CollaboratorSingleSelect } from "@/components/collaborator/CollaboratorSingleSelect";

interface SongEntryProps {
  onNext: () => void;
  onBack: () => void;
}

export const SongEntry: React.FC<SongEntryProps> = ({
  onNext,
  onBack,
}) => {
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [filterValue, setFilterValue] = React.useState("");
  // const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  // Debounced search query for API calls
  const debouncedSearchQuery = useDebouncedValue(filterValue, 500);

  // Reset page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const pageSize = 50;

  // Sort descriptor state - must be before the query
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: "display_name",
    direction: "ascending",
  });

  // Infinite query for tracks
  const tracksQuery = useInfiniteQuery({
    queryKey: [
      "tracks",
      organizationId,
      debouncedSearchQuery,
      sortDescriptor.column,
      sortDescriptor.direction,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId) return { tracks: [], total: 0 };
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      const result = await fetchTracks({
        token,
        limit: pageSize,
        offset: pageParam * pageSize,
        search: debouncedSearchQuery || undefined,
        sortBy: sortDescriptor.column === "name" ? "display_name" : 
               sortDescriptor.column === "releaseDate" ? "release_date" : 
               sortDescriptor.column as string,
        sortOrder: sortDescriptor.direction === "ascending" ? "asc" : "desc",
      });

      return result;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total || 0;
      const loadedCount = allPages.reduce(
        (sum, page) => sum + (page.tracks?.length || 0),
        0
      );
      return loadedCount < total ? allPages.length : undefined;
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Get all tracks from all pages
  const allTracks = React.useMemo(() => {
    return (
      tracksQuery.data?.pages.flatMap(
        (page) => page.tracks || []
      ) || []
    );
  }, [tracksQuery.data]);

  // Get total count
  const totalTracks = tracksQuery.data?.pages[0]?.total ?? 0;


  const updateSong = async (id: string, field: string, value: string) => {

    try {
      // setIsUpdating(id);
      const token = await getToken({ template: "bard-backend" });

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const updates: any = {};
      
      // Map frontend field names to backend field names
      const fieldMapping: Record<string, string> = {
        displayName: "display_name",
        albumId: "album_id",
        artistId: "artist_id",
        releaseDate: "release_date",
        spotifyTrackId: "spotify_track_id",
        initialSource: "initial_source",
      };

      const backendField = fieldMapping[field] || field;
      updates[backendField] = value;

      await updateTrack({
        token,
        trackId: id,
        updates,
        onSuccess: () => {
          toast.success("Track updated");
          queryClient.invalidateQueries({
            queryKey: ["tracks", organizationId],
          });
        },
        onError: (error) => {
          console.error("Failed to update track:", error);
          toast.error("Failed to update track");
        }
      });
    } catch (error) {
      console.error("Error updating song:", error);
      toast.error("Failed to update track");
    } finally {
      // setIsUpdating(null);
    }
  };

  const deleteSong = async (id: string) => {
    try {
      setIsDeleting(id);
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      await deleteTrack({
        token,
        trackId: id,
        onSuccess: () => {
          toast.success("Track deleted");
          queryClient.invalidateQueries({
            queryKey: ["tracks", organizationId],
          });
        },
        onError: (error) => {
          console.error("Failed to delete track:", error);
          toast.error("Failed to delete track");
        }
      });
    } catch (error) {
      console.error("Error deleting song:", error);
      toast.error("Failed to delete track");
    } finally {
      setIsDeleting(null);
    }
  };

  const [page, setPage] = React.useState(1);
  const itemsPerPage = 12;
  
  const totalPages = useMemo(() => {
    return Math.ceil(totalTracks / itemsPerPage);
  }, [totalTracks]);

  const handleContinue = () => {
    onNext();
  };

  const handleSortChange = (descriptor: {
    column: string;
    direction: "ascending" | "descending";
  }) => {
    setSortDescriptor(descriptor);
    // Reset page when sorting changes
    setPage(1);
  };

  // Calculate which tracks to show for current page
  const paginatedTracks = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // If we don't have enough data for the current page and there's more data available, return empty to trigger loading
    if (
      allTracks.length < endIndex &&
      tracksQuery.hasNextPage &&
      !tracksQuery.isFetchingNextPage
    ) {
      // Trigger fetch next page
      tracksQuery.fetchNextPage();
    }

    return allTracks.slice(startIndex, endIndex);
  }, [
    allTracks,
    page,
    tracksQuery.hasNextPage,
    tracksQuery.isFetchingNextPage,
  ]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 sm:p-6 space-y-4 flex flex-1 flex-col">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Songs Review</h2>
            <p className="text-default-500">
              Review and confirm the details for your songs. It's normal to be
              missing metadata and contact information, just fill in what is
              accessible. We'll provide you a to-do list after onboarding.
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 w-full">
          <div className="flex flex-row justify-between">
            <Input
              classNames={{
                base: "max-w-full sm:max-w-[20rem] h-10",
                mainWrapper: "h-full",
                input: "text-small",
                inputWrapper:
                  "h-full font-normal text-default-500 bg-default-100",
              }}
              placeholder="Search song..."
              size="sm"
              startContent={
                <Icon icon="lucide:search" className="text-default-400" />
              }
              type="search"
              onValueChange={setFilterValue}
              value={filterValue}
            />
            <Button
              color="primary"
              variant="flat"
              startContent={<Icon icon="lucide:plus" />}
              onPress={() => setIsModalOpen(true)}
            >
              Add Song
            </Button>
          </div>

          <div className="h-full flex flex-col w-full">
            {tracksQuery.isLoading && allTracks.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <Spinner size="md" />
                <span className="ml-2 text-default-500">
                  Loading tracks...
                </span>
              </div>
            ) : allTracks.length > 0 ? (
              <>
                <Table
                  removeWrapper
                  aria-label="Song management table"
                  className="border border-default-200 rounded-medium flex-1 overflow-scroll"
                  classNames={{
                    table: "absolute",
                  }}
                  sortDescriptor={sortDescriptor}
                  onSortChange={handleSortChange}
                >
                  <TableHeader>
                    <TableColumn allowsSorting key="name">
                      NAME
                    </TableColumn>
                    <TableColumn allowsSorting key="album">
                      ALBUM
                    </TableColumn>
                    <TableColumn allowsSorting key="artist" className="min-w-[200px]">
                      ARTIST
                    </TableColumn>
                    <TableColumn allowsSorting key="isrc">
                      ISRC
                    </TableColumn>
                    <TableColumn allowsSorting key="status" className="min-w-[150px]">
                      STATUS
                    </TableColumn>
                    <TableColumn allowsSorting key="releaseDate">
                      RELEASE DATE
                    </TableColumn>
                    <TableColumn allowsSorting key="pitch">
                      PITCH
                    </TableColumn>
                    <TableColumn allowsSorting key="source">
                      SOURCE
                    </TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No songs found">
                    {paginatedTracks.map((song) => {
                      return (
                        <TableRow key={song.id}>
                          <TableCell>
                            <EditableCell
                              initialValue={song.display_name}
                              onSave={(value) =>
                                updateSong(song.id, "displayName", value)
                              }
                              // isLoading={isUpdating === song.id}
                            />
                          </TableCell>
                          <TableCell>
                            <AlbumSingleSelect
                              defaultSelected={song.album ? { id: song.album.id, title: song.album.title || "" } : null}
                              setSelected={(album) => updateSong(song.id, "album_id", album?.id || "")}
                              variant="table"
                            />
                          </TableCell>
                          <TableCell>
                            <CollaboratorSingleSelect
                              value={song.artist_id}
                              setSelected={() => {}}
                              onValueChange={(collaboratorId) =>
                                updateSong(song.id, "artist_id", collaboratorId)
                              }
                              displayValue={
                                song.artist?.legal_name || song.artist?.artist_name || "-"
                              }
                              variant="table"
                              placeholder="Search artists..."
                            />
                          </TableCell>
                          <TableCell>
                            <EditableCell
                              initialValue={song.isrc || ""}
                              onSave={(value) =>
                                updateSong(song.id, "isrc", value)
                              }
                              // isLoading={isUpdating === song.id}
                            />
                          </TableCell>
                          <TableCell>
                            <EditableCell
                              initialValue={song.status || ""}
                              label={song.status || ""}
                              options={STATUSES.map((status: any) => ({
                                value: status,
                                label: status,
                              }))}
                              onSave={(value) =>
                                updateSong(song.id, "status", value)
                              }
                              // isLoading={isUpdating === song.id}
                            />
                          </TableCell>
                          <TableCell>
                            <EditableCell
                              initialValue={song.release_date || ""}
                              type="date"
                              onSave={(value) =>
                                updateSong(song.id, "release_date", value)
                              }
                              // isLoading={isUpdating === song.id}
                            />
                          </TableCell>
                          <TableCell>
                            <EditableCell
                              initialValue={song.pitch || ""}
                              onSave={(value) =>
                                updateSong(song.id, "pitch", value)
                              }
                              // isLoading={isUpdating === song.id}
                            />
                          </TableCell>
                          <TableCell>{song.initial_source || ""}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Tooltip content="Delete track">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  isLoading={isDeleting === song.id}
                                  onPress={() => deleteSong(song.id)}
                                >
                                  {isDeleting === song.id ? null : <Icon icon="lucide:trash-2" />}
                                </Button>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="flex justify-center mt-4">
                  <Pagination
                    total={totalPages}
                    initialPage={1}
                    page={page}
                    onChange={setPage}
                    showControls
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8 border border-dashed rounded-lg border-default-200 flex-1 flex flex-col items-center justify-center">
                <Icon
                  icon="lucide:music"
                  className="mx-auto mb-2 text-default-400"
                  width={32}
                  height={32}
                />
                <p className="text-default-500">No songs added yet</p>
                <p className="text-xs text-default-400 mt-1">
                  Add your first song using the form above
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 mt-auto">
          <Button variant="flat" onPress={onBack} size="lg">
            Previous
          </Button>
          <Button
            color="primary"
            onPress={handleContinue}
            size="lg"
          >
            Next
          </Button>
        </div>
      </div>
      <SimpleNewSongModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        successCallback={() => {
          queryClient.invalidateQueries({
            queryKey: ["tracks", organizationId],
          });
        }}
      />
    </div>
  );
};
