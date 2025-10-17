"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import {
  Avatar,
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Divider,
  Spinner,
} from "@heroui/react";
import { useAuth } from "@clerk/nextjs";
import { fetchTracks, Track } from "@/lib/api/tracks";
import { useInfiniteQuery } from "@tanstack/react-query";

export type TrackOption = {
  value: string;
  label: string;
  subtitle?: string;
};

type Props = {
  defaultSelected?: TrackOption[];
  setSelected: (value: TrackOption[]) => void;
  title?: string;
  maxItems?: number;
  onSelect?: (track: Track) => void;
  onUnselect?: (trackId: string) => void;
  keepSearchOnSelect?: boolean;
};

const ITEMS_PER_PAGE = 20;

export function TrackMultiSelect({
  defaultSelected = [],
  setSelected,
  title,
  maxItems,
  onSelect,
  onUnselect,
  keepSearchOnSelect = false,
}: Props) {
  const { getToken } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelectedInternal] = useState<TrackOption[]>(defaultSelected);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Update selected when defaultSelected changes
  useEffect(() => {
    setSelectedInternal(defaultSelected);
  }, [defaultSelected]);

  // Infinite query for paginated tracks
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["tracks-select", debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      return fetchTracks({
        token,
        limit: ITEMS_PER_PAGE,
        offset: (pageParam as number) * ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages: any[]) => {
      // If we got less than the page size, there are no more pages
      if (lastPage.tracks.length < ITEMS_PER_PAGE) {
        return undefined;
      }
      return allPages.length;
    },
    enabled: isOpen,
  });

  // Flatten all pages of tracks
  const allTracks = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.tracks) || [];
  }, [data]);

  // Convert tracks to options and filter out already selected ones
  const availableOptions = useMemo(() => {
    const selectedIds = new Set(selected.map(s => s.value));
    return allTracks
      .filter(track => !selectedIds.has(track.id))
      .map(track => ({
        value: track.id,
        label: track.display_name || "Unknown Track",
        subtitle: track.status || undefined,
      }));
  }, [allTracks, selected]);

  const handleUnselect = useCallback((option: TrackOption) => {
    setSelectedInternal((prev) => {
      const removed = prev.filter((s) => s.value !== option.value);
      setSelected(removed);
      
      // Call onUnselect callback if provided
      if (onUnselect) {
        onUnselect(option.value);
      }
      
      return removed;
    });
  }, [setSelected, onUnselect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "") {
          setSelectedInternal((prev) => {
            const newSelected = [...prev];
            const removedItem = newSelected.pop();
            setSelected(newSelected);
            
            // Call onUnselect callback if provided
            if (onUnselect && removedItem) {
              onUnselect(removedItem.value);
            }
            
            return newSelected;
          });
        }
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
  }, [setSelected, onUnselect]);

  const handleSelect = (option: TrackOption) => {
    if (maxItems !== undefined && selected.length >= maxItems) {
      return;
    }
    
    if (!keepSearchOnSelect) {
      setSearchValue("");
    }
    setSelectedInternal((prev) => {
      const newSelected = [...prev, option];
      setSelected(newSelected);
      
      // Call onSelect callback with track data if provided
      if (onSelect) {
        const track = allTracks.find(t => t.id === option.value);
        if (track) {
          onSelect(track);
        }
      }
      
      return newSelected;
    });
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInternal([]);
    setSelected([]);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Load more when scrolled to 80% of the content
    if (scrollHeight - scrollTop <= clientHeight * 1.2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <Popover 
        isOpen={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setSearchValue("");
          }
        }}
        placement="bottom-start"
      >
        <PopoverTrigger>
          <div
            role="button"
            tabIndex={0}
            className="flex justify-between items-center w-full h-auto flex-wrap min-h-12 px-4 py-2 border border-default-300 bg-content1 rounded-medium cursor-pointer hover:bg-default-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex flex-wrap gap-2 w-[calc(100%-80px)]">
              {selected.length > 0 ? (
                selected.map((option) => (
                  <div 
                    key={option.value} 
                    className="flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-sm"
                  >
                    <span>{option.label}</span>
                    <div
                      className="cursor-pointer focus:outline-none rounded-full hover:bg-primary-200 p-0.5 transition-colors inline-flex items-center justify-center"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnselect(option);
                      }}
                    >
                      <Icon icon="lucide:x" className="h-3 w-3" />
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-default-500">
                  {title || "Select Tracks..."}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {selected.length > 0 && (
                <div
                  role="button"
                  tabIndex={0}
                  className="min-w-0 h-auto py-1 px-2 text-xs font-medium text-danger cursor-pointer hover:bg-danger-50 rounded transition-colors"
                  onClick={handleClearAll}
                >
                  Clear
                </div>
              )}
              <Icon
                icon="lucide:chevron-down"
                className="text-default-500 h-4 w-4"
              />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[350px] shadow-lg overflow-hidden">
          <div className="p-3 bg-content1 w-full">
            <Input
              ref={inputRef}
              placeholder="Search tracks by name..."
              value={searchValue}
              onValueChange={setSearchValue}
              startContent={
                <Icon icon="lucide:search" className="text-default-400" />
              }
              size="sm"
              variant="bordered"
              classNames={{
                inputWrapper: "border-default-300 w-full",
                input: "w-full",
                base: "w-full",
              }}
              fullWidth
              autoFocus
            />
          </div>
          <Divider />
          <div 
            className="max-h-[300px] overflow-y-auto py-1 w-full"
            onScroll={handleScroll}
          >
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <Spinner size="sm" />
              </div>
            )}
            
            {isError && (
              <div className="py-8 text-center text-danger-500">
                <Icon
                  icon="lucide:alert-circle"
                  className="mx-auto h-6 w-6 mb-2"
                />
                <p>Error loading tracks</p>
              </div>
            )}
            
            {!isLoading && !isError && availableOptions.length === 0 && (
              <div className="py-8 text-center text-default-500">
                <Icon
                  icon="lucide:search-x"
                  className="mx-auto h-6 w-6 mb-2 opacity-50"
                />
                <p>
                  {maxItems !== undefined && selected.length >= maxItems
                    ? `Maximum of ${maxItems} tracks selected.`
                    : debouncedSearch 
                    ? "No tracks found."
                    : "No tracks available."}
                </p>
              </div>
            )}
            
            {!isLoading && !isError && availableOptions.length > 0 && (
              <div className="w-full">
                {availableOptions.map((option) => (
                  <div
                    key={option.value}
                    className="mx-1 px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-default-100 transition-colors flex items-center gap-3"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelect(option);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 font-medium">
                      <Icon icon="lucide:music" className="h-4 w-4" />
                    </div>
                    <div className="flex-grow min-w-0 text-left">
                      <div className="font-medium truncate text-left">{option.label}</div>
                      {option.subtitle && (
                        <div className="text-xs text-default-500 truncate text-left">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isFetchingNextPage && (
                  <div className="flex justify-center items-center py-4">
                    <Spinner size="sm" />
                  </div>
                )}
                
                {!hasNextPage && allTracks.length > 0 && (
                  <div className="text-center py-2 text-xs text-default-400">
                    No more tracks
                  </div>
                )}
              </div>
            )}
          </div>
          {maxItems !== undefined && selected.length > 0 && (
            <>
              <Divider />
              <div className="p-2 text-center text-xs text-default-500">
                {selected.length}/{maxItems} selected
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}