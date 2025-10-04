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
  Tooltip,
} from "@heroui/react";
import { useAuth } from "@clerk/nextjs";
import { fetchCollaborators, Collaborator } from "@/lib/api/collaborators";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CollaboratorSelection } from "./types";

type Props = {
  defaultSelected?: CollaboratorSelection | null;
  setSelected: (value: CollaboratorSelection | null) => void;
  title?: string;
  label?: string;
  placeholder?: string;
  showClearButton?: boolean;
  useLegalName?: boolean;
  variant?: "compact" | "form" | "table";
  // Table variant specific props
  value?: string;
  onValueChange?: (collaboratorId: string) => void;
  displayValue?: string;
  errorMessage?: string;
  disabled?: boolean;
};

const ITEMS_PER_PAGE = 20;

export function CollaboratorSingleSelect({
  defaultSelected,
  setSelected,
  title,
  label,
  placeholder = "Search collaborators...",
  showClearButton = false,
  useLegalName = false,
  variant = "form",
  // Table variant props
  value,
  onValueChange,
  displayValue,
  errorMessage,
  disabled = false,
}: Props) {
  const { getToken } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelectedInternal] = useState<CollaboratorSelection | null>(
    defaultSelected ?? null
  );
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
    setSelectedInternal(defaultSelected ?? null);
  }, [defaultSelected]);

  // Infinite query for paginated collaborators
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["collaborators-single-select", debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      return fetchCollaborators({
        token,
        limit: ITEMS_PER_PAGE,
        offset: (pageParam as number) * ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages: any[]) => {
      // If we got less than the page size, there are no more pages
      if (lastPage.collaborators.length < ITEMS_PER_PAGE) {
        return undefined;
      }
      return allPages.length;
    },
    enabled: isOpen,
  });

  // Flatten all pages of collaborators
  const allCollaborators = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.collaborators) || [];
  }, [data]);

  // Convert collaborators to options
  const availableOptions: CollaboratorSelection[] = useMemo(() => {
    return allCollaborators.map((collaborator: Collaborator) => ({
      id: collaborator.id,
      label: useLegalName 
        ? (collaborator.legal_name || collaborator.artist_name || "Unknown")
        : (collaborator.artist_name || collaborator.legal_name || "Unknown"),
      avatar: "", // Could be added if avatars are available
      subtitle: collaborator.email,
    }));
  }, [allCollaborators, useLegalName]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
  }, []);

  const handleSelect = (option: CollaboratorSelection) => {
    setSearchValue("");
    setSelectedInternal(option);
    setSelected(option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInternal(null);
    setSelected(null);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Load more when scrolled to 80% of the content
    if (scrollHeight - scrollTop <= clientHeight * 1.2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Table variant helper functions
  const handleTableSelect = (collaboratorId: string) => {
    if (onValueChange) {
      onValueChange(collaboratorId);
    }
    setIsOpen(false);
    setSearchValue("");
  };

  // Table variant - similar to AlbumSingleSelect
  if (variant === "table") {
    const cellDisplay = displayValue || "-";
    
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
            <span>{cellDisplay}</span>
            {!disabled && <Icon icon="lucide:chevron-down" className="text-xs" />}
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[350px] shadow-lg overflow-hidden">
          <div className="p-3 bg-content1 w-full">
            <Input
              ref={inputRef}
              placeholder={placeholder}
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
                <p>Error loading collaborators</p>
              </div>
            )}
            
            {!isLoading && !isError && availableOptions.length === 0 && (
              <div className="py-8 text-center text-default-500">
                <Icon
                  icon="lucide:search-x"
                  className="mx-auto h-6 w-6 mb-2 opacity-50"
                />
                <p>
                  {debouncedSearch 
                    ? "No collaborators found."
                    : "No collaborators available."}
                </p>
              </div>
            )}
            
            {!isLoading && !isError && availableOptions.length > 0 && (
              <div className="w-full">
                {availableOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`mx-1 px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-default-100 transition-colors flex items-center gap-3 ${
                      value === option.id ? "bg-primary-50 text-primary-600" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTableSelect(option.id);
                    }}
                  >
                    {value === option.id && (
                      <Icon icon="lucide:check" className="text-primary w-4 h-4" />
                    )}
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 font-medium">
                      <Icon icon="lucide:user" className="h-4 w-4" />
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
                
                {!hasNextPage && allCollaborators.length > 0 && (
                  <div className="text-center py-2 text-xs text-default-400">
                    No more collaborators
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Variant-specific styling for form and compact variants
  const getButtonClasses = () => {
    const baseClasses = "justify-between w-full border-default-200 relative group";
    
    if (variant === "form") {
      return `${baseClasses} h-14 px-3 py-2 bg-default-50 hover:bg-default-100 data-[hover=true]:border-default-400`;
    }
    
    // compact variant (default)
    return `${baseClasses} h-8 px-3 py-1 border-default-300 bg-content1`;
  };

  return (
    <div onKeyDown={handleKeyDown} className="w-full">
      <Popover 
        isOpen={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setSearchValue("");
          }
        }}
        placement="bottom"
      >
        <PopoverTrigger>
          <Button
            variant="bordered"
            className={getButtonClasses()}
          >
            {variant === "form" ? (
              <div className="flex flex-col items-start justify-center w-[calc(100%-80px)] relative">
                {label && (
                  <span className="text-xs text-default-600 font-medium">
                    {label}
                  </span>
                )}
                {selected ? (
                  <div className="flex items-center gap-2 pt-1">
                    {selected.avatar && (
                      <Avatar 
                        src={selected.avatar} 
                        size="sm" 
                        className="w-4 h-4"
                      />
                    )}
                    <span className="font-medium text-sm truncate text-default-700">{selected.label}</span>
                  </div>
                ) : (
                  <span className="text-default-400 text-sm pt-1">
                    {title || "Select collaborator..."}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 w-[calc(100%-80px)]">
                {selected ? (
                  <div className="flex items-center gap-2">
                    {selected.avatar && (
                      <Avatar 
                        src={selected.avatar} 
                        size="sm" 
                        className="w-6 h-6"
                      />
                    )}
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm truncate">{selected.label}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-default-500 text-sm">
                    {title || "Select collaborator..."}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {selected && showClearButton && (
                <div
                  role="button"
                  tabIndex={0}
                  className="min-w-0 h-auto p-1 text-danger cursor-pointer hover:bg-danger-50 rounded transition-colors"
                  onClick={handleClear}
                >
                  <Icon icon="lucide:x" className="h-3 w-3" />
                </div>
              )}
              <Icon
                icon="lucide:chevron-down"
                className="text-default-500 h-4 w-4"
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[350px] shadow-lg overflow-hidden">
          <div className="p-3 bg-content1 w-full">
            <Input
              ref={inputRef}
              placeholder={placeholder}
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
                <p>Error loading collaborators</p>
              </div>
            )}
            
            {!isLoading && !isError && availableOptions.length === 0 && (
              <div className="py-8 text-center text-default-500">
                <Icon
                  icon="lucide:search-x"
                  className="mx-auto h-6 w-6 mb-2 opacity-50"
                />
                <p>
                  {debouncedSearch 
                    ? "No collaborators found."
                    : "No collaborators available."}
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
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 font-medium">
                      <Icon icon="lucide:user" className="h-4 w-4" />
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
                
                {!hasNextPage && allCollaborators.length > 0 && (
                  <div className="text-center py-2 text-xs text-default-400">
                    No more collaborators
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}