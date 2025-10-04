"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import {
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Divider,
  Spinner,
  Chip,
} from "@heroui/react";
import { useAuth } from "@clerk/nextjs";
import { fetchAlbums, Album } from "@/lib/api/albums";
import { useInfiniteQuery } from "@tanstack/react-query";

export interface AlbumSelection {
  id: string;
  label: string;
  subtitle?: string;
}

type Props = {
  defaultSelected?: AlbumSelection[];
  setSelected: (value: AlbumSelection[]) => void;
  title?: string;
  maxItems?: number;
};

const ITEMS_PER_PAGE = 20;

export function AlbumMultiSelect({
  defaultSelected = [],
  setSelected,
  title,
  maxItems,
}: Props) {
  const { getToken } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelectedInternal] = useState<AlbumSelection[]>(defaultSelected);
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

  // Infinite query for paginated albums
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["albums-select", debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      return fetchAlbums({
        token,
        limit: ITEMS_PER_PAGE,
        offset: (pageParam as number) * ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages: any[]) => {
      // If we got less than the page size, there are no more pages
      if (lastPage.albums.length < ITEMS_PER_PAGE) {
        return undefined;
      }
      return allPages.length;
    },
    enabled: isOpen,
  });

  // Flatten all pages of albums
  const allAlbums = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.albums) || [];
  }, [data]);

  // Convert albums to options and filter out already selected ones
  const availableOptions: AlbumSelection[] = useMemo(() => {
    const selectedIds = new Set(selected.map(s => s.id));
    return allAlbums
      .filter(album => !selectedIds.has(album.id))
      .map(album => ({
        id: album.id,
        label: album.title || "Untitled Album",
        subtitle: album.release_date ? `Released: ${album.release_date}` : undefined,
      }));
  }, [allAlbums, selected]);

  const handleUnselect = useCallback((option: AlbumSelection) => {
    setSelectedInternal((prev) => {
      const removed = prev.filter((s) => s.id !== option.id);
      setSelected(removed);
      return removed;
    });
  }, [setSelected]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "") {
          setSelectedInternal((prev) => {
            const newSelected = [...prev];
            newSelected.pop();
            setSelected(newSelected);
            return newSelected;
          });
        }
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
  }, [setSelected]);

  const handleSelect = (option: AlbumSelection) => {
    if (maxItems !== undefined && selected.length >= maxItems) {
      return;
    }
    
    setSearchValue("");
    setSelectedInternal((prev) => {
      const newSelected = [...prev, option];
      setSelected(newSelected);
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
          <Button
            variant="bordered"
            className="w-full justify-between h-12"
            size="md"
            startContent={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:disc" className="text-default-400" />
                <span>
                  {selected.length === 0 
                    ? (title || "Select albums") 
                    : `${selected.length} album${selected.length === 1 ? '' : 's'} selected`
                  }
                </span>
              </div>
            }
            endContent={
              <Icon icon="lucide:chevron-down" className="text-default-400" />
            }
            onClick={() => setIsOpen(!isOpen)}
          />
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[350px] shadow-lg overflow-hidden">
          <div className="p-3 bg-content1 w-full">
            <Input
              ref={inputRef}
              placeholder="Search albums by title..."
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
                <p>Error loading albums</p>
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
                    ? `Maximum of ${maxItems} albums selected.`
                    : debouncedSearch 
                    ? "No albums found."
                    : "No albums available."}
                </p>
              </div>
            )}
            
            {!isLoading && !isError && availableOptions.length > 0 && (
              <div className="w-full">
                {availableOptions.map((option) => (
                  <div
                    key={option.id}
                    className="mx-1 px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-default-100 transition-colors flex items-center gap-3"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelect(option);
                    }}
                  >
                    <div className="w-8 h-8 rounded-md bg-primary-100 flex items-center justify-center text-primary-500 font-medium">
                      <Icon icon="lucide:disc" className="w-4 h-4" />
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
                
                {!hasNextPage && allAlbums.length > 0 && (
                  <div className="text-center py-2 text-xs text-default-400">
                    No more albums
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
      
      {/* Selected Album Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map((option) => (
            <Chip
              key={option.id}
              size="sm"
              variant="flat"
              color="default"
              className="bg-default-100 text-default-600"
              onClose={() => handleUnselect(option)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}