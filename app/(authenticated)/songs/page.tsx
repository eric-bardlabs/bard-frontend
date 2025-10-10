"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Chip,
  Checkbox,
  DatePicker,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useOrganization, useAuth } from "@clerk/nextjs";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { STATUSES } from "@/components/songs/types/song";
import { SongsTable } from "@/components/songs/songs-table";
import { NewAlbumModal } from "@/components/songs/new-album-modal";
import NewSongModal from "@/components/songs/new-song-modal";
import { SpotifyImportModal } from "@/components/songs/spotify-import-modal";
import { fetchTracks } from "@/lib/api/tracks";
import { Track } from "@/lib/api/tracks";
import { Album } from "@/lib/api/albums";
import { AlbumMultiSelect, AlbumSelection } from "@/components/album/AlbumMultiSelect";

type CreateOption =
  | "album"
  | "song"
  | "importSpotify";


const Songs: React.FC = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const queryClient = useQueryClient();

  // Search and filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedAlbums, setSelectedAlbums] = React.useState<AlbumSelection[]>([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [startDate, setStartDate] = React.useState<any>(null);
  const [endDate, setEndDate] = React.useState<any>(null);
  
  const pageSize = 100;
    
  // Debounced search query for API calls
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 750);

  const [isNewAlbumModalOpen, setIsNewAlbumModalOpen] = React.useState(false);
  const [isNewSongModalOpen, setIsNewSongModalOpen] = React.useState(false);
  const [isSpotifyImportModalOpen, setIsSpotifyImportModalOpen] = React.useState(false);

  // Memoize query parameters to prevent unnecessary re-renders
  const queryParams = React.useMemo(() => ({
    search: debouncedSearchQuery || undefined,
    albumIds: selectedAlbums.length > 0 ? selectedAlbums.map(a => a.id).sort().join(',') : undefined,
    statuses: selectedStatuses.length > 0 ? selectedStatuses.sort().join(',') : undefined,
    startDate: startDate ? startDate.toString() : undefined,
    endDate: endDate ? endDate.toString() : undefined,
  }), [debouncedSearchQuery, selectedAlbums, selectedStatuses, startDate, endDate]);

  // Fetch tracks with infinite query
  const tracksQuery = useInfiniteQuery({
    queryKey: [
      "tracks", 
      organizationId, 
      queryParams
    ],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId) return { tracks: [], total: 0 };
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const result = await fetchTracks({
        token,
        limit: pageSize,
        offset: pageParam * pageSize,
        search: queryParams.search,
        albumId: queryParams.albumIds ? queryParams.albumIds.split(',') : undefined,
        status: queryParams.statuses ? queryParams.statuses.split(',') : undefined,
        releaseDateStart: queryParams.startDate,
        releaseDateEnd: queryParams.endDate,
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
    staleTime: 60 * 1000, // Increased stale time for better performance
    gcTime: 10 * 60 * 1000, // Increased garbage collection time
  });

  // Get all tracks from all pages
  const allTracks = React.useMemo(() => {
    return tracksQuery.data?.pages.flatMap(page => page.tracks || []) || [];
  }, [tracksQuery.data]);

  const refresh = () => {
    tracksQuery.refetch();
  };
  
  // Get current tracks and total info
  const totalTracks = tracksQuery.data?.pages[0]?.total ?? 0;

  const isInitialLoading = false; // AlbumMultiSelect handles its own loading
  const isLoadingTracks = tracksQuery.isLoading && allTracks.length === 0;
  const isLoadingMore = tracksQuery.isFetchingNextPage;

  // Handle album selection
  const handleAlbumSelectionChange = useCallback((albumSelections: AlbumSelection[]) => {
    setSelectedAlbums(albumSelections);
  }, []);
  
  // Handle individual status selection
  const handleStatusToggle = useCallback((status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    setSelectedStatuses(newStatuses);
  }, [selectedStatuses]);
  
  // Handle date range changes
  const handleStartDateChange = useCallback((date: any) => {
    setStartDate(date);
  }, []);
  
  const handleEndDateChange = useCallback((date: any) => {
    setEndDate(date);
  }, []);
  
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedAlbums([]);
    setSelectedStatuses([]);
    setStartDate(null);
    setEndDate(null);
  }, []);
  
  // Load more tracks for infinite scroll
  const loadMoreTracks = useCallback(() => {
    if (tracksQuery.hasNextPage && !isLoadingMore) {
      tracksQuery.fetchNextPage();
    }
  }, [tracksQuery.hasNextPage, isLoadingMore, tracksQuery.fetchNextPage]);
  
  // Infinite scroll detection
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 1000) {
      loadMoreTracks();
    }
  }, [loadMoreTracks]);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleSongSelect = (songId: React.Key | null) => {
    if (!songId) {
      return;
    }
    router.push(`/songs/${songId}`);
  };


  // Update song field
  const updateSongField = useCallback((
    songId: string,
    field: keyof Track,
    value: string
  ) => {
    // After updating, refresh all pages to get fresh data
    tracksQuery.refetch();
  }, [tracksQuery.refetch]);

  // Handle create new options
  const handleCreateOption = useCallback((key: React.Key) => {
    const option = key.toString() as CreateOption;

    switch (option) {
      case "album":
        setIsNewAlbumModalOpen(true);
        break;
      case "song":
        setIsNewSongModalOpen(true);
        break;
      case "importSpotify":
        setIsSpotifyImportModalOpen(true);
        break;
      default:
        break;
    }
  }, []);



  if (isInitialLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="mx-2 pt-[88px] md:pt-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Songs</h1>
        <p className="text-default-500 mt-1">Manage and organize your songs, albums, and collaborations</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by title, artist, or album..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1"
            startContent={
              <Icon icon="lucide:search" className="text-default-400" />
            }
            isClearable
            onClear={() => handleSearchChange("")}
          />
          
          <Dropdown>
            <DropdownTrigger>
              <Button
                className="lg:w-fit w-full"
                color="primary"
                endContent={
                  <Icon icon="lucide:chevron-down" className="text-small" />
                }
              >
                <Icon icon="lucide:plus" className="text-small" />
                Add Music
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Create options"
              onAction={handleCreateOption}
            >
              <DropdownItem
                key="album"
                startContent={
                  <Icon icon="lucide:disc" className="text-primary" />
                }
                description="Create a new album for your songs"
              >
                New Album
              </DropdownItem>
              <DropdownItem
                key="song"
                startContent={
                  <Icon icon="lucide:music" className="text-primary" />
                }
                description="Add a new song to your collection"
                >
                New Song
              </DropdownItem>
              <DropdownItem
                key="importSpotify"
                startContent={<Icon icon="logos:spotify-icon" />}
                description="Import songs, albums, or playlists"
              >
                Import from Spotify
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
        
        {/* Filter Row */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Album Multi-Select Filter */}
          <div className="w-full sm:w-64">
            <AlbumMultiSelect
              defaultSelected={selectedAlbums}
              setSelected={handleAlbumSelectionChange}
              title="Select albums"
            />
          </div>
          
          {/* Custom Status Filter with Checkboxes */}
          <div className="w-full sm:w-64">
            <div className="space-y-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="bordered"
                    className="w-full justify-between h-12"
                    size="md"
                    startContent={
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:flag" className="text-default-400" />
                        <span>
                          {selectedStatuses.length === 0 
                            ? "Select statuses" 
                            : `${selectedStatuses.length} status${selectedStatuses.length === 1 ? '' : 'es'} selected`
                          }
                        </span>
                      </div>
                    }
                    endContent={
                      <Icon icon="lucide:chevron-down" className="text-default-400" />
                    }
                  >
                  </Button>
                </DropdownTrigger>
              <DropdownMenu
                aria-label="Status filter"
                closeOnSelect={false}
                disallowEmptySelection={false}
                className="min-w-[200px]"
                selectionMode="none"
              >
                {STATUSES.map((status) => (
                  <DropdownItem
                    key={status}
                    className="capitalize"
                    textValue={status}
                    onPress={() => handleStatusToggle(status)}
                    startContent={
                      <Checkbox
                        isSelected={selectedStatuses.includes(status)}
                        size="sm"
                        onValueChange={() => handleStatusToggle(status)}
                      />
                    }
                  >
                    {status}
                  </DropdownItem>
                ))}
              </DropdownMenu>
              </Dropdown>
              
              {/* Selected Status Chips */}
              {selectedStatuses.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedStatuses.map((status) => (
                    <Chip
                      key={status}
                      size="sm"
                      variant="flat"
                      color="default"
                      className="bg-default-100 text-default-600"
                      onClose={() => {
                        const newStatuses = selectedStatuses.filter(s => s !== status);
                        setSelectedStatuses(newStatuses);
                      }}
                    >
                      {status}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Release Date Range Filter and Clear Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <div className="w-full sm:w-[440px]">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <DatePicker
                      label="Released After"
                      value={startDate}
                      onChange={handleStartDateChange}
                      variant="bordered"
                      size="md"
                      className="w-full h-12"
                      showMonthAndYearPickers
                    />
                  </div>
                  <div className="flex-1">
                    <DatePicker
                      label="Released Before"
                      value={endDate}
                      onChange={handleEndDateChange}
                      variant="bordered"
                      size="md"
                      className="w-full h-12"
                      showMonthAndYearPickers
                    />
                  </div>
                </div>
                
                {/* Date Range Chips */}
                {(startDate || endDate) && (
                  <div className="flex flex-wrap gap-1">
                    {startDate && (
                      <Chip
                        size="sm"
                        variant="flat"
                        color="default"
                        className="bg-default-100 text-default-600"
                        onClose={() => {
                          setStartDate(null);
                        }}
                      >
                        Released After: {startDate.toString()}
                      </Chip>
                    )}
                    {endDate && (
                      <Chip
                        size="sm"
                        variant="flat"
                        color="default"
                        className="bg-default-100 text-default-600"
                        onClose={() => {
                          setEndDate(null);
                        }}
                      >
                        Released Before: {endDate.toString()}
                      </Chip>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Clear Filters Button */}
            {(searchQuery || selectedAlbums.length > 0 || selectedStatuses.length > 0 || startDate || endDate) && (
              <div className="lg:mt-0 mt-4">
                <Button
                  variant="flat"
                  onPress={clearFilters}
                  startContent={<Icon icon="lucide:x" />}
                  className="h-12"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-default-500 mb-6">
        <span>
          Total: {totalTracks} songs in your catalog
        </span>
      </div>

      {/* Results */}
      {allTracks.length === 0 && (searchQuery || selectedAlbums.length > 0 || selectedStatuses.length > 0 || startDate || endDate) && !isLoadingTracks ? (
        <div className="text-center p-10 bg-content1 rounded-lg">
          <Icon icon="lucide:search-x" className="text-default-300 mb-3" width={48} height={48} />
          <p className="text-default-500">
            No songs found matching your search criteria
          </p>
          <Button
            variant="light"
            className="mt-3"
            onPress={clearFilters}
          >
            Clear filters
          </Button>
        </div>
      ) : allTracks.length > 0 || isLoadingTracks || isLoadingMore ? (
        <div className="space-y-6">
          {/* Songs Table */}
          <div className="bg-content1 rounded-lg p-4 shadow-sm">
            {isLoadingTracks ? (
              <div className="flex justify-center items-center py-12">
                <Spinner size="md" />
                <span className="ml-2 text-default-500">Loading tracks...</span>
              </div>
            ) : (
              <SongsTable
                songs={allTracks}
                onSongSelect={handleSongSelect}
                onUpdateSong={updateSongField}
                uniqueStatuses={STATUSES}
              />
            )}
          </div>
          
          {/* Infinite Scroll Loading Indicator */}
          {isLoadingMore && (
            <div className="flex justify-center items-center py-4">
              <Spinner size="md" />
              <span className="ml-2 text-default-500 text-sm">Loading more songs...</span>
            </div>
          )}
          
          {/* End of Results Indicator */}
          {!tracksQuery.hasNextPage && allTracks.length > 0 && (
            <div className="text-center py-4 text-sm text-default-400">
              No more songs to load
            </div>
          )}
        </div>
      ) : !isInitialLoading ? (
        <div className="text-center p-10 bg-content1 rounded-lg">
          <Icon icon="lucide:music" className="text-default-300 mb-3" width={48} height={48} />
          <p className="text-lg font-medium text-default-600 mb-1">
            No songs in your catalog yet
          </p>
          <p className="text-default-500 mb-4">
            Start building your music library by adding songs or importing from Spotify
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              color="primary"
              onPress={() => setIsNewSongModalOpen(true)}
              startContent={<Icon icon="lucide:plus" />}
            >
              Add Your First Song
            </Button>
            <Button
              variant="flat"
              onPress={() => setIsSpotifyImportModalOpen(true)}
              startContent={<Icon icon="logos:spotify-icon" />}
            >
              Import from Spotify
            </Button>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      <NewAlbumModal
        isOpen={isNewAlbumModalOpen}
        onClose={() => setIsNewAlbumModalOpen(false)}
        successCallback={refresh}
      />

      <NewSongModal
        isOpen={isNewSongModalOpen}
        onClose={() => setIsNewSongModalOpen(false)}
        successCallback={refresh}
      />

      <SpotifyImportModal
        isOpen={isSpotifyImportModalOpen}
        onClose={() => setIsSpotifyImportModalOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
};

export default Songs;
