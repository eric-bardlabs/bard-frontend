"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import {
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Divider,
  Spinner,
  Tooltip,
  Button,
} from "@heroui/react";
import { useAuth } from "@clerk/nextjs";
import { fetchAlbums, Album } from "@/lib/api/albums";
import { useInfiniteQuery } from "@tanstack/react-query";

export interface AlbumOption {
  id: string;
  title: string;
}

type Props = {
  // New pattern - accept defaultSelected AlbumOption
  defaultSelected?: AlbumOption | null;
  setSelected: (album: AlbumOption | null) => void;
  // Legacy props for backward compatibility  
  isLoading?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  variant?: "table" | "form";
  label?: string;
  placeholder?: string;
};

const ITEMS_PER_PAGE = 20;

export function AlbumSingleSelect({
  defaultSelected,
  setSelected,
  isLoading = false,
  errorMessage,
  disabled = false,
  variant = "table",
  label,
  placeholder,
}: Props) {
  const { getToken } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Internal state to track selected album (similar to CollaboratorSingleSelect)
  const [selectedInternal, setSelectedInternal] = useState<AlbumOption | null>(
    defaultSelected ?? null
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Update selectedInternal when defaultSelected changes
  useEffect(() => {
    setSelectedInternal(defaultSelected ?? null);
  }, [defaultSelected]);

  // Infinite query for paginated albums
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingAlbums,
    isError,
  } = useInfiniteQuery({
    queryKey: ["albums-single-select", debouncedSearch],
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
    enabled: isOpen && !disabled,
  });

  // Flatten all pages of albums
  const allAlbums = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.albums) || [];
  }, [data]);

  // Convert albums to options
  const albumOptions: AlbumOption[] = useMemo(() => {
    return allAlbums.map(album => ({
      id: album.id,
      title: album.title || "Untitled Album",
    }));
  }, [allAlbums]);

  const handleSelect = (option: AlbumOption) => {
    setSearchValue("");
    setSelectedInternal(option);
    setSelected(option);
    setIsOpen(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Load more when scrolled to 80% of the content
    if (scrollHeight - scrollTop <= clientHeight * 1.2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Form variant - looks like Select but has search functionality
  if (variant === "form") {
    // Use selectedInternal for display (similar to CollaboratorSingleSelect)
    const displayText = selectedInternal?.title || "";
    
    return (
      <Popover 
        isOpen={isOpen && !disabled} 
        onOpenChange={(open) => {
          if (!disabled) {
            setIsOpen(open);
            if (!open) {
              setSearchValue("");
            }
          }
        }}
        placement="bottom-start"
      >
        <PopoverTrigger>
          <Button
            variant="bordered"
            className="w-full h-14 px-3 py-2 bg-default-50 hover:bg-default-100 data-[hover=true]:border-default-400 justify-start"
            isDisabled={disabled}
          >
            <div className="flex flex-col items-start justify-center w-full">
              {label && (
                <span className="text-xs text-default-600 font-medium">
                  {label}
                </span>
              )}
              {displayText ? (
                <div className="flex items-center gap-2 pt-1">
                  <Icon icon="lucide:disc" className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm truncate text-default-700">
                    {displayText}
                  </span>
                </div>
              ) : (
                <span className="text-default-400 text-sm pt-1">
                  {placeholder || "Select an album..."}
                </span>
              )}
            </div>
            <Icon 
              icon="lucide:chevron-down" 
              className="w-4 h-4 text-default-400 flex-shrink-0 ml-2" 
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px] shadow-lg overflow-hidden">
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
            className="max-h-[250px] overflow-y-auto py-1 w-full"
            onScroll={handleScroll}
          >
            {isLoadingAlbums && (
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
            
            {!isLoadingAlbums && !isError && albumOptions.length === 0 && (
              <div className="py-8 text-center text-default-500">
                <Icon
                  icon="lucide:search-x"
                  className="mx-auto h-6 w-6 mb-2 opacity-50"
                />
                <p>
                  {debouncedSearch 
                    ? "No albums found."
                    : "No albums available."}
                </p>
              </div>
            )}
            
            {!isLoadingAlbums && !isError && albumOptions.length > 0 && (
              <div className="w-full">
                {albumOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`mx-1 px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-default-100 transition-colors flex items-center gap-3 ${
                      selectedInternal?.id === option.id ? "bg-primary-50 text-primary-600" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelect(option);
                    }}
                  >
                    {selectedInternal?.id === option.id && (
                      <Icon icon="lucide:check" className="text-primary w-4 h-4" />
                    )}
                    <div className="w-8 h-8 rounded-md bg-primary-100 flex items-center justify-center text-primary-500 font-medium">
                      <Icon icon="lucide:disc" className="w-4 h-4" />
                    </div>
                    <div className="flex-grow min-w-0 text-left">
                      <div className="font-medium truncate text-left">{option.title}</div>
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
        </PopoverContent>
      </Popover>
    );
  }

  // Table variant using Popover (original implementation)
  return (
    <Popover 
      isOpen={isOpen && !disabled} 
      onOpenChange={(open) => {
        if (!disabled) {
          setIsOpen(open);
          if (!open) {
            setSearchValue("");
          }
        }
      }}
      placement="bottom-start"
    >
      <PopoverTrigger>
        <div 
          className={`flex items-center gap-1 transition-colors ${
            disabled 
              ? "cursor-not-allowed opacity-60" 
              : "cursor-pointer hover:text-primary"
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          {isLoading ? (
            <Spinner size="sm" color="primary" className="mr-1" />
          ) : errorMessage ? (
            <Tooltip content={errorMessage} color="danger">
              <Icon icon="lucide:alert-circle" className="text-danger mr-1" />
            </Tooltip>
          ) : null}
          <span>{selectedInternal?.title || "-"}</span>
          {!disabled && <Icon icon="lucide:chevron-down" className="text-xs" />}
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px] shadow-lg overflow-hidden">
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
          className="max-h-[250px] overflow-y-auto py-1 w-full"
          onScroll={handleScroll}
        >
          {isLoadingAlbums && (
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
          
          {!isLoadingAlbums && !isError && albumOptions.length === 0 && (
            <div className="py-8 text-center text-default-500">
              <Icon
                icon="lucide:search-x"
                className="mx-auto h-6 w-6 mb-2 opacity-50"
              />
              <p>
                {debouncedSearch 
                  ? "No albums found."
                  : "No albums available."}
              </p>
            </div>
          )}
          
          {!isLoadingAlbums && !isError && albumOptions.length > 0 && (
            <div className="w-full">
              {albumOptions.map((option) => (
                <div
                  key={option.id}
                  className={`mx-1 px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-default-100 transition-colors flex items-center gap-3 ${
                    selectedInternal?.id === option.id ? "bg-primary-50 text-primary-600" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(option);
                  }}
                >
                  {selectedInternal?.id === option.id && (
                    <Icon icon="lucide:check" className="text-primary w-4 h-4" />
                  )}
                  <div className="w-8 h-8 rounded-md bg-primary-100 flex items-center justify-center text-primary-500 font-medium">
                    <Icon icon="lucide:disc" className="w-4 h-4" />
                  </div>
                  <div className="flex-grow min-w-0 text-left">
                    <div className="font-medium truncate text-left">{option.title}</div>
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
      </PopoverContent>
    </Popover>
  );
}