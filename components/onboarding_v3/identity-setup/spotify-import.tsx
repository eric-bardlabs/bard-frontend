import React from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useOrganization, useAuth } from "@clerk/nextjs";
import { OnboardingFormData } from "@/types/onboarding";
import { Track, TrackCollaborator, fetchTracks } from "@/lib/api/tracks";
import { Album } from "@/lib/api/albums";

interface SpotifyImportProps {
  onboardingData: OnboardingFormData;
  onPendingStateChange: (pending: boolean) => void;
  onUrlValidationChange?: (hasValidUrl: boolean) => void;
  showImportModal?: boolean;
  handleSpotifyModalSkip?: () => void;
  handleSpotifyModalImport?: () => void;
  saveInitialData?: (data: OnboardingFormData) => void;
}

export function SpotifyImport({
  onboardingData,
  onPendingStateChange,
  onUrlValidationChange,
  showImportModal = false,
  handleSpotifyModalSkip,
  handleSpotifyModalImport,
  saveInitialData,
}: SpotifyImportProps) {
  const [spotifyUrl, setSpotifyUrl] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [importedSpotifyData, setImportedSpotifyData] = React.useState<any[]>(
    []
  );

  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const organizationId = organization?.id;
  const queryClient = useQueryClient();

  const pageSize = 50;

  // URL validation regex patterns
  const albumRegex =
    /https:\/\/open.spotify.com\/album\/([a-zA-Z0-9]+)(?:\?si=.*)?/;
  const playlistRegex =
    /https:\/\/open.spotify.com\/playlist\/([a-zA-Z0-9]+)(?:\?si=.*)?/;
  const trackRegex =
    /https:\/\/open.spotify.com\/track\/([a-zA-Z0-9]+)(?:\?si=.*)?/;
  const artistRegex =
    /https:\/\/open.spotify.com\/artist\/([a-zA-Z0-9]+)(?:\?si=.*)?/;

  // Function to validate Spotify URL
  const isValidSpotifyUrl = (url: string): boolean => {
    const trimmedUrl = url.trim();
    return !!(
      trimmedUrl.match(albumRegex) ||
      trimmedUrl.match(playlistRegex) ||
      trimmedUrl.match(trackRegex) ||
      trimmedUrl.match(artistRegex)
    );
  };

  // Notify parent component about URL validation state
  React.useEffect(() => {
    if (onUrlValidationChange) {
      onUrlValidationChange(isValidSpotifyUrl(spotifyUrl));
    }
  }, [spotifyUrl, onUrlValidationChange]);

  // Infinite query for Spotify tracks
  const spotifyTracksQuery = useInfiniteQuery({
    queryKey: ["spotify-tracks", organizationId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId) return { tracks: [], total: 0 };
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const result = await fetchTracks({
        token,
        limit: pageSize,
        offset: pageParam * pageSize,
        initialSource: "spotify", // Filter for Spotify tracks only
      });
      
      return result;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total || 0;
      const loadedCount = allPages.reduce((sum, page) => sum + (page.tracks?.length || 0), 0);
      return loadedCount < total ? allPages.length : undefined;
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Get all tracks from all pages
  const allSpotifyTracks = React.useMemo(() => {
    return spotifyTracksQuery.data?.pages.flatMap(page => page.tracks || []) || [];
  }, [spotifyTracksQuery.data]);

  // Get total count
  const totalSpotifyTracks = spotifyTracksQuery.data?.pages[0]?.total ?? 0;

  const importSpotify = useMutation({
    mutationKey: ["importSpotifyData"],
    mutationFn: async (data: { type: string; spotifyId: string }) => {
      return axios.post("/api/import-from-spotify", {
        ...data,
        organizationId,
      });
    },
    onSuccess: (response) => {
      // Add imported tracks to the display
      if (response.data.tracks && response.data.tracks.length > 0) {
        setImportedSpotifyData((prev) => [...prev, ...response.data.tracks]);
      }

      // Update parent data with new link
      const currentLinks = onboardingData?.links || [];
      const linkExists = currentLinks.some((link: any) => link === spotifyUrl);

      if (!linkExists) {
        const updatedData = {
          ...onboardingData,
          links: [...currentLinks, spotifyUrl],
        };
        // Save to database if saveInitialData is provided
        if (saveInitialData) {
          saveInitialData(updatedData);
        }
      }
      
      // Invalidate and refetch the Spotify tracks query
      queryClient.invalidateQueries({ queryKey: ["spotify-tracks", organizationId] });

      // Clear the input
      setSpotifyUrl("");
    },
    onError: (error: any) => {
      console.error("Failed to import Spotify data:", error);
      const errorMessage =
        error?.response?.data?.detail || "Failed to import data from Spotify";
      setErrors({ spotifyLink: errorMessage });
    },
  });

  const handleImport = async () => {
    // check spotifyUrl is valid
    const newErrors: Record<string, string> = {};
    const url = spotifyUrl.trim();

    if (!url) {
      newErrors.spotifyLink = "Spotify link is required";
      setErrors(newErrors);
      return;
    }

    if (!isValidSpotifyUrl(url)) {
      newErrors.spotifyLink = "Please enter a valid Spotify link";
      setErrors(newErrors);
      return;
    }

    if (!organizationId) {
      newErrors.spotifyLink =
        "Organization not found. Please complete basic information first.";
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Extract Spotify ID and type from URL
    let type: string;
    let spotifyId: string | null = null;

    if (url.match(albumRegex)) {
      type = "album";
      spotifyId = url.match(albumRegex)?.[1] || null;
    } else if (url.match(playlistRegex)) {
      type = "playlist";
      spotifyId = url.match(playlistRegex)?.[1] || null;
    } else if (url.match(trackRegex)) {
      type = "track";
      spotifyId = url.match(trackRegex)?.[1] || null;
    } else if (url.match(artistRegex)) {
      type = "artist";
      spotifyId = url.match(artistRegex)?.[1] || null;
    } else {
      newErrors.spotifyLink = "Invalid Spotify URL format";
      setErrors(newErrors);
      return;
    }

    if (!spotifyId) {
      newErrors.spotifyLink = "Could not extract Spotify ID from URL";
      setErrors(newErrors);
      return;
    }

    importSpotify.mutate({
      type,
      spotifyId,
    });
  };

  const handleImportFromModal = () => {
    handleImport();
    if (handleSpotifyModalImport) {
      handleSpotifyModalImport();
    }
  };

  React.useEffect(() => {
    onPendingStateChange(importSpotify.isPending);
  }, [importSpotify.isPending, onPendingStateChange]);

  // Infinite scroll detection for Spotify tracks
  const handleSpotifyTracksScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      if (spotifyTracksQuery.hasNextPage && !spotifyTracksQuery.isFetchingNextPage) {
        spotifyTracksQuery.fetchNextPage();
      }
    }
  }, [spotifyTracksQuery.hasNextPage, spotifyTracksQuery.isFetchingNextPage, spotifyTracksQuery.fetchNextPage]);

  return (
    <>
      <Card className="flex-1 mt-4">
        <CardBody className="flex flex-col space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <Icon icon="logos:spotify-icon" width={32} height={32} />
            </div>
            <div>
              <h3 className="text-lg font-medium">Connect Spotify</h3>
              <p className="text-default-500 text-sm">
                Copy and paste spotify links for songs, albums, playlists, or
                even artists and we can pull the available metadata for those
                songs.
              </p>
              <p className="text-default-500 text-sm">
                You can pull from as many links as you want and you will also
                have the ability to pull from spotify after onboarding.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Input
              label="Spotify Link"
              placeholder="Enter artist, album, playlist, or track link..."
              value={spotifyUrl}
              onValueChange={setSpotifyUrl}
              isInvalid={!!errors.spotifyLink}
              errorMessage={errors.spotifyLink}
              startContent={
                <Icon icon="logos:spotify-icon" className="text-lg" />
              }
            />

            <Button
              disabled={importSpotify.isPending}
              color="success"
              variant="flat"
              isLoading={importSpotify.isPending}
              startContent={
                importSpotify.isPending ? null : (
                  <Icon icon="lucide:refresh-cw" />
                )
              }
              onPress={handleImport}
              className="w-full h-[48px]"
            >
              {importSpotify.isPending ? "Importing..." : "Import from Spotify"}
            </Button>
          </div>

          <Tabs
            classNames={{
              panel: "!mt-0 h-full",
            }}
          >
            <Tab
              key="imported"
              title={`Current Import (${importedSpotifyData.length})`}
            >
              <div className="h-full border">
                {importedSpotifyData.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-4 text-default-500">
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="bg-default-100 p-4 rounded-full mb-4">
                        <Icon
                          icon={"lucide:music"}
                          className="text-4xl text-default-400"
                        />
                      </div>
                      <p className="text-default-500 max-w-md">
                        Enter Spotify links above and click "Import from
                        Spotify" to create a new import
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-auto">
                    <Table
                      aria-label="Songs table"
                      removeWrapper
                      classNames={{
                        wrapper: "shadow-none",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>NAME</TableColumn>
                        <TableColumn>ALBUM</TableColumn>
                        <TableColumn>COLLABORATORS</TableColumn>
                        <TableColumn>STATUS</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {importedSpotifyData.map((track, index) => (
                          <TableRow key={`imported-${index}`}>
                            <TableCell className="">{track.name}</TableCell>
                            <TableCell className="">
                              {track.albumName}
                            </TableCell>
                            <TableCell>
                              {track.collaborators.length > 2
                                ? track.collaborators.slice(0, 2).join(", ") +
                                  ` and ${track.collaborators.length - 2} more`
                                : track.collaborators.join(", ")}
                            </TableCell>
                            <TableCell className="text-success">
                              Imported
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Tab>
            <Tab
              key="urlHistory"
              title={`Link History (${onboardingData?.links?.length || 0})`}
            >
              <div className="h-full border">
                {!onboardingData?.links || onboardingData.links.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-4 text-default-500">
                    <p className="text-sm">No links imported</p>
                  </div>
                ) : (
                  <div className="h-full overflow-auto">
                    <Table
                      aria-label="URL history table"
                      removeWrapper
                      classNames={{
                        wrapper: "shadow-none",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>URL</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {onboardingData.links.map(
                          (link: string, index: number) => (
                            <TableRow key={`link-${index}`}>
                              <TableCell className="">{link}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Tab>
            <Tab
              key="historical"
              title={`Import History (${totalSpotifyTracks})`}
            >
              <div className="h-full border">
                {spotifyTracksQuery.isLoading && allSpotifyTracks.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-4">
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <Spinner size="lg" className="mb-4" />
                      <p className="text-default-500">Loading Spotify tracks...</p>
                    </div>
                  </div>
                ) : allSpotifyTracks.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-4 text-default-500">
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="bg-default-100 p-4 rounded-full mb-4">
                        <Icon
                          icon={"lucide:music"}
                          className="text-4xl text-default-400"
                        />
                      </div>
                      <p className="text-default-500 max-w-md">
                        No tracks imported from Spotify yet
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-auto" onScroll={handleSpotifyTracksScroll}>
                    <Table
                      aria-label="Historical songs table"
                      removeWrapper
                      classNames={{
                        wrapper: "shadow-none",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>NAME</TableColumn>
                        <TableColumn>ALBUM</TableColumn>
                        <TableColumn>COLLABORATORS</TableColumn>
                        <TableColumn>STATUS</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {allSpotifyTracks.map((track: Track) => (
                          <TableRow key={track.id}>
                            <TableCell className="">
                              {track.display_name}
                            </TableCell>
                            <TableCell className="">
                              {track.album?.title || "No Album"}
                            </TableCell>
                            <TableCell>
                              {track.collaborators
                                ?.map(
                                  (c: TrackCollaborator) =>
                                    c.artist_name || c.legal_name
                                )
                                .join(", ") || "No Collaborators"}
                            </TableCell>
                            <TableCell className="text-success">
                              {track.status}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Loading indicator for infinite scroll */}
                    {spotifyTracksQuery.isFetchingNextPage && (
                      <div className="flex justify-center items-center py-4">
                        <Spinner size="sm" />
                        <span className="ml-2 text-default-500 text-sm">Loading more tracks...</span>
                      </div>
                    )}
                    
                    {/* End of results indicator */}
                    {!spotifyTracksQuery.hasNextPage && allSpotifyTracks.length > 0 && (
                      <div className="text-center py-4 text-sm text-default-400">
                        No more tracks to load
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Import Confirmation Modal */}
      <Modal isOpen={showImportModal} onClose={handleSpotifyModalImport}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="logos:spotify-icon" className="text-xl" />
              <span>Import from Spotify</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              You have a valid Spotify link in the input field that hasn't been
              imported yet. Would you like to import this data before
              continuing?
            </p>
            <div className="mt-4 p-3 bg-default-50 rounded-lg">
              <p className="text-sm font-medium text-default-700">
                Link to import:
              </p>
              <p className="text-sm text-default-600 break-all">{spotifyUrl}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={handleSpotifyModalSkip}
              isDisabled={importSpotify.isPending}
            >
              Skip Import
            </Button>
            <Button
              color="success"
              onPress={handleImportFromModal}
              isLoading={importSpotify.isPending}
              isDisabled={importSpotify.isPending}
            >
              {importSpotify.isPending ? "Importing..." : "Import Link"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
