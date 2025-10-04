"use client";

import {
  useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCollaborators, Collaborator } from "@/lib/api/collaborators";
import { useAuth } from "@clerk/nextjs";

import { Icon } from "@iconify/react";

import { MoreHorizontalIcon, Search } from "lucide-react";
import {
  Button,
  Chip,
  User,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  useDisclosure,
  Input,
  Spinner,
  Pagination,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  type SortDescriptor,
} from "@heroui/react";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { CollaboratorModal } from "@/components/collaborator/CollaboratorModal";
import { useOrganization } from "@clerk/nextjs";
import { ProfileCard } from "@/components/collaborator/profile-card";
import clsx from "clsx";
import { RelatedSongs } from "../../../components/collaborator/relatedSongs";

const COLUMNS = [
  { name: "Artist Name", uid: "artist_name", sortable: true },
  { name: "Legal Name", uid: "legal_name", sortable: true },
  { name: "Related Songs", uid: "related_songs" },
  { name: "ACTIONS", uid: "actions" },
];

const Collaborators = () => {
  const { organization, membership } = useOrganization();
  const organizationId = organization?.id;
  const isOrganizationAdmin = membership?.permissions.includes(
    "org:sys_memberships:manage"
  );
  const { getToken } = useAuth();

  const queryClient = useQueryClient();

  // State declarations
  const [filterValue, setFilterValue] = useState("");
  const [debouncedFilterValue, setDebouncedFilterValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "artist_name", 
    direction: "ascending",
  });
  const [editingIndex, setEditingIndex] = useState<number | undefined>(
    undefined
  );
  const [viewingIndex, setViewingIndex] = useState<number | undefined>(
    undefined
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterValue(filterValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterValue]);

  // Reset page when debounced search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedFilterValue]);

  // Reset page when sorting changes
  useEffect(() => {
    setPage(1);
  }, [sortDescriptor.column, sortDescriptor.direction]);

  // Data Fetching with pagination
  const { data, isLoading, refetch } = useQuery({
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      // Fetch more data than we display to reduce API calls
      // We display 10 per page but fetch 50 to cache ahead
      const FETCH_SIZE = 50;
      const DISPLAY_SIZE = 10;
      const fetchPage = Math.floor((page - 1) / (FETCH_SIZE / DISPLAY_SIZE));
      
      const response = await fetchCollaborators({
        token,
        limit: FETCH_SIZE,
        offset: fetchPage * FETCH_SIZE,
        search: debouncedFilterValue || undefined,
        sortBy: sortDescriptor.column as string,
        sortOrder: sortDescriptor.direction === "ascending" ? "asc" : "desc",
        includeRelatedSongs: true,
        includeRelationships: true,
      });
      
      return { ...response, fetchPage, currentPage: page };
    },
    queryKey: ["myCollaborators", Math.floor((page - 1) / 5), debouncedFilterValue, sortDescriptor.column, sortDescriptor.direction],
    enabled: !!organizationId,
  });

  // Slice the fetched data to show only current page (10 items)
  const allFetchedCollaborators = data?.collaborators ?? [];
  const DISPLAY_SIZE = 10;
  const FETCH_SIZE = 50;
  const itemsPerFetch = FETCH_SIZE / DISPLAY_SIZE; // 5 pages per fetch
  const fetchPage = Math.floor((page - 1) / itemsPerFetch);
  const pageWithinFetch = (page - 1) % itemsPerFetch;
  const startIndex = pageWithinFetch * DISPLAY_SIZE;
  const endIndex = startIndex + DISPLAY_SIZE;
  
  const collaborators = allFetchedCollaborators.slice(startIndex, endIndex);
  
  // Preserve previous total count during loading to prevent UI flicker
  const [stableTotal, setStableTotal] = useState(0);
  useEffect(() => {
    if (data?.total !== undefined) {
      setStableTotal(data.total);
    }
  }, [data?.total]);
  
  const totalCollaborators = data?.total ?? stableTotal;

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const {
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose,
    onOpenChange: onViewModalOpenChange,
  } = useDisclosure();

  const pages = Math.ceil(totalCollaborators / 10);
  const items = collaborators;

  const deleteCollaborator = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const { deleteCollaborator } = await import("@/lib/api/collaborators");
      return deleteCollaborator({
        token,
        id: collaboratorId,
      });
    },
    mutationKey: ["deleteCollaborator"],
    onSuccess: (data) => {
      toast.success("Collaborator Deleted");
      queryClient.invalidateQueries({
        queryKey: ["myCollaborators"],
      });
    },
  });

  const renderCell = useCallback(
    (
      collaborator: Collaborator,
      index: number,
      columnKey: React.Key
    ) => {
      switch (columnKey) {
        case "artist_name":
          return (
            <User
              avatarProps={{ radius: "lg", src: "" }}
              description={collaborator.email}
              name={collaborator.artist_name || collaborator.legal_name}
            >
              {collaborator.email}
            </User>
          );
        case "legal_name":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {collaborator.legal_name}
              </p>
            </div>
          );
        case "related_songs":
          return (
            <div className="relative flex flex-col items-start gap-1">
              <RelatedSongs songs={collaborator.related_songs?.map(song => ({
                id: song.id,
                displayName: song.display_name
              })) || []} />
            </div>
          );
        case "actions":
          return (
            <div className="relative flex justify-end items-center gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="light">
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions">
                  <DropdownItem
                    key="view"
                    onPress={() => {
                      setViewingIndex(index);
                      // onOpen();
                    }}
                  >
                    View
                  </DropdownItem>
                  <DropdownItem
                    key="edit"
                    className={clsx(
                      isOrganizationAdmin
                        ? "block"
                        : "hidden"
                    )}
                    onPress={() => {
                      setEditingIndex(index);
                    }}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className={clsx(
                      "text-danger",
                      isOrganizationAdmin ? "block" : "hidden"
                    )}
                    onPress={() => deleteCollaborator.mutate(collaborator.id)}
                    color="danger"
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return "";
      }
    },
    []
  );

  const onNextPage = useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onSearchChange = useCallback((value?: string) => {
    setFilterValue(value || "");
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex md:flex-row flex-col items-start justify-between gap-3">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name..."
            startContent={<Search />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            {isOrganizationAdmin && (
              <Button
                endContent={<Icon icon="rivet-icons:plus" />}
                color="primary"
                onPress={onOpen}
              >
                Add Collaborator
              </Button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {totalCollaborators} Collaborators
          </span>
        </div>
        <CollaboratorModal
          isOpen={isOpen || editingIndex !== undefined}
          onClose={() => {
            onClose();
            setEditingIndex(undefined);
            refetch();
          }}
          collaborator={
            editingIndex !== undefined ? items[editingIndex] : undefined
          }
        ></CollaboratorModal>
      </div>
    );
  }, [
    filterValue,
    editingIndex,
    isOpen,
    onSearchChange,
    totalCollaborators,
  ]);

  const bottomContent = useMemo(() => {
    if (pages === 0) {
      return null;
    }
    
    return (
      <div className="py-2 px-2 flex justify-center items-center">
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
          initialPage={1}
          key={`pagination-${totalCollaborators}`}
        />
      </div>
    );
  }, [page, pages]);

  return (
    <div className="flex flex-col h-full px-4">
      <div className="flex flex-row justify-between pt-4  md:pt-0">
        <h1 className="text-[24px] md:text-[36px]">Collaborators</h1>
      </div>
      <div className="flex flex-row justify-center w-full pt-4 md:pt-8">
        <Table
          aria-label="Example table with custom cells, pagination and sorting"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: "max-h-[800px] min-h-[400px]",
          }}
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={COLUMNS}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody 
            emptyContent={isLoading ? <Spinner size="lg" /> : "No collaborators found"}
            isLoading={isLoading}
            loadingContent={<Spinner size="lg" />}
          >
            {items.map((item, idx) => (
              <TableRow
                key={item.id}
                className={
                  idx === items.length - 1 ? "border-none" : "border-b-1"
                }
              >
                {(columnKey) => (
                  <TableCell>
                    {renderCell(item, idx, columnKey)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Modal
          isOpen={isViewModalOpen || viewingIndex !== undefined}
          onOpenChange={onViewModalOpenChange}
          onClose={() => {
            onViewModalClose();
            setViewingIndex(undefined);
          }}
        >
          <ModalContent>
            <ProfileCard
              myProfile={items[viewingIndex ?? 0]}
              showEdit={false}
              subHeaderOverride="   "
              headerOverride={`${items[viewingIndex ?? 0]?.artist_name || items[viewingIndex ?? 0]?.legal_name || ""}'s Profile`}
              showRelationships={true}
            />
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default Collaborators;
