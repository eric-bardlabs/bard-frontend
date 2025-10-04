import React, { useMemo, useCallback } from "react";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { EditableCell } from "./editable-cell";
import { CollaboratorModal } from "@/components/collaborator/CollaboratorModal";
import { CollaboratorSingleSelect } from "@/components/collaborator/CollaboratorSingleSelect";
import { CollaboratorSelection } from "@/components/collaborator/types";
import {
  updateCollaborator,
  deleteCollaborator,
  fetchCollaborators,
} from "@/lib/api/collaborators";
import { toast } from "sonner";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Collaborator } from "@/lib/api/collaborators";

interface CollaboratorEntryProps {
  onNext: () => void;
  onBack: () => void;
}

export const CollaboratorEntry: React.FC<CollaboratorEntryProps> = ({
  onNext,
  onBack,
}) => {
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const queryClient = useQueryClient();

  const [filterValue, setFilterValue] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Debounced search query for API calls
  const debouncedSearchQuery = useDebouncedValue(filterValue, 500);

  // Reset page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const pageSize = 50;

  // Sort descriptor state - must be before the query
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: "legal_name",
    direction: "ascending",
  });

  // Infinite query for collaborators
  const collaboratorsQuery = useInfiniteQuery({
    queryKey: [
      "collaborators",
      organizationId,
      debouncedSearchQuery,
      sortDescriptor.column,
      sortDescriptor.direction,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId) return { collaborators: [], total: 0 };
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      const result = await fetchCollaborators({
        token,
        limit: pageSize,
        offset: pageParam * pageSize,
        search: debouncedSearchQuery || undefined,
        sortBy:
          sortDescriptor.column === "legalName"
            ? "legal_name"
            : sortDescriptor.column === "artistName"
              ? "artist_name"
              : (sortDescriptor.column as string),
        sortOrder: sortDescriptor.direction === "ascending" ? "asc" : "desc",
        includeRelatedSongs: false,
        includeRelationships: false,
      });

      return result;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total || 0;
      const loadedCount = allPages.reduce(
        (sum, page) => sum + (page.collaborators?.length || 0),
        0
      );
      return loadedCount < total ? allPages.length : undefined;
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Get all collaborators from all pages
  const allCollaborators = React.useMemo(() => {
    return (
      collaboratorsQuery.data?.pages.flatMap(
        (page) => page.collaborators || []
      ) || []
    );
  }, [collaboratorsQuery.data]);

  // Get total count
  const totalCollaborators = collaboratorsQuery.data?.pages[0]?.total ?? 0;

  // Delete warning modal state
  const [deleteWarningModal, setDeleteWarningModal] = React.useState({
    isOpen: false,
    collaboratorToDelete: null as Collaborator | null,
    replacementMode: false,
    selectedReplacement: null as CollaboratorSelection | null,
    showReplacementOption: false,
  });

  const handleUpdateCollaborator = async (
    id: string,
    updates: Record<string, any>
  ) => {
    const token = await getToken({ template: "bard-backend" });
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    await updateCollaborator({
      token,
      id,
      updates,
      onSuccess: () => {
        // Invalidate and refetch the collaborators query
        queryClient.invalidateQueries({
          queryKey: ["collaborators", organizationId],
        });
      },
      onError: (error) => {
        console.error("Failed to update collaborator:", error);
        toast.error("Failed to update collaborator");
        // Optionally revert the local change on error
      },
    });
  };

  const handleDeleteCollaborator = async (
    id: string,
    replacementId?: string
  ) => {
    try {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      await deleteCollaborator({
        token,
        id,
        replacementCollaboratorId: replacementId,
        onSuccess: (result) => {
          toast.success(
            replacementId
              ? `Collaborator replaced successfully. ${result.affected_tracks} tracks and ${result.affected_sessions} sessions updated.`
              : `Collaborator deleted successfully. ${result.affected_tracks} tracks and ${result.affected_sessions} sessions updated.`
          );

          // Invalidate and refetch the collaborators query
          queryClient.invalidateQueries({
            queryKey: ["collaborators", organizationId],
          });
        },
        onError: (error) => {
          console.error("Failed to delete collaborator:", error);
          toast.error("Failed to delete collaborator");
        },
      });
    } catch (error) {
      console.error("Error deleting collaborator:", error);
    }
  };

  const handleDeleteClick = (collaborator: Collaborator) => {
    setDeleteWarningModal({
      isOpen: true,
      collaboratorToDelete: collaborator,
      replacementMode: false,
      selectedReplacement: null,
      showReplacementOption: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteWarningModal.collaboratorToDelete) {
      const replacementId =
        deleteWarningModal.replacementMode &&
        deleteWarningModal.selectedReplacement
          ? deleteWarningModal.selectedReplacement.id
          : undefined;

      await handleDeleteCollaborator(
        deleteWarningModal.collaboratorToDelete.id,
        replacementId
      );
    }

    setDeleteWarningModal({
      isOpen: false,
      collaboratorToDelete: null,
      replacementMode: false,
      selectedReplacement: null,
      showReplacementOption: false,
    });
  };

  const handleDeleteCancel = () => {
    setDeleteWarningModal({
      isOpen: false,
      collaboratorToDelete: null,
      replacementMode: false,
      selectedReplacement: null,
      showReplacementOption: false,
    });
  };

  // Helper function to check if there are other collaborators available for replacement
  const hasOtherCollaborators = () => {
    // This will be handled by CollaboratorSingleSelect internally
    // We can assume there are collaborators if we're showing the option
    return true;
  };

  const [page, setPage] = React.useState(1);
  const itemsPerPage = 12;

  const totalPages = useMemo(() => {
    return Math.ceil(totalCollaborators / itemsPerPage);
  }, [totalCollaborators]);

  // Calculate which collaborators to show for current page
  const paginatedCollaborators = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // If we don't have enough data for the current page and there's more data available, return empty to trigger loading
    if (
      allCollaborators.length < endIndex &&
      collaboratorsQuery.hasNextPage &&
      !collaboratorsQuery.isFetchingNextPage
    ) {
      // Trigger fetch next page
      collaboratorsQuery.fetchNextPage();
    }

    return allCollaborators.slice(startIndex, endIndex);
  }, [
    allCollaborators,
    page,
    collaboratorsQuery.hasNextPage,
    collaboratorsQuery.isFetchingNextPage,
  ]);

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

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 sm:p-6 space-y-4 flex flex-1 flex-col">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Collaborators Review</h2>
            <p className="text-default-500">
              Review and confirm the details for your collaborators. It's normal
              to be missing some information, just fill in what is accessible.
              We'll provide you a to-do list after onboarding.
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-row justify-between">
            <Input
              classNames={{
                base: "max-w-full sm:max-w-[20rem] h-10",
                mainWrapper: "h-full",
                input: "text-small",
                inputWrapper:
                  "h-full font-normal text-default-500 bg-default-100",
              }}
              placeholder="Search collaborator..."
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
              Add Collaborator
            </Button>
          </div>

          <div className="h-full flex flex-col">
            {collaboratorsQuery.isLoading && allCollaborators.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <Spinner size="md" />
                <span className="ml-2 text-default-500">
                  Loading collaborators...
                </span>
              </div>
            ) : allCollaborators.length > 0 ? (
              <>
                <Table
                  removeWrapper
                  aria-label="Song management table"
                  classNames={{
                    base: "border border-default-200 rounded-medium flex-1 overflow-scroll",
                  }}
                  sortDescriptor={sortDescriptor}
                  onSortChange={handleSortChange}
                >
                  <TableHeader>
                    <TableColumn allowsSorting key="legalName">
                      LEGAL NAME
                    </TableColumn>
                    <TableColumn allowsSorting key="artistName">
                      ARTIST NAME
                    </TableColumn>
                    <TableColumn allowsSorting key="email">
                      EMAIL
                    </TableColumn>
                    <TableColumn allowsSorting key="pro">
                      PRO
                    </TableColumn>
                    <TableColumn allowsSorting key="proId">
                      PRO ID
                    </TableColumn>
                    <TableColumn allowsSorting key="initialSource">
                      SOURCE
                    </TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No songs found">
                    {paginatedCollaborators.map((collaborator) => (
                      <TableRow key={collaborator.id}>
                        <TableCell>
                          <EditableCell
                            initialValue={collaborator.legal_name ?? ""}
                            onSave={(value) =>
                              handleUpdateCollaborator(collaborator.id, {
                                legal_name: value,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            initialValue={collaborator.artist_name ?? ""}
                            onSave={(value) =>
                              handleUpdateCollaborator(collaborator.id, {
                                artist_name: value,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            initialValue={collaborator.email ?? ""}
                            onSave={(value) =>
                              handleUpdateCollaborator(collaborator.id, {
                                email: value,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            initialValue={collaborator.pro ?? ""}
                            onSave={(value) =>
                              handleUpdateCollaborator(collaborator.id, {
                                pro: value,
                              })
                            }
                            options={[
                              { value: "ASCAP", label: "ASCAP" },
                              { value: "BMI", label: "BMI" },
                              { value: "SESAC", label: "SESAC" },
                              { value: "SOCAN", label: "SOCAN" },
                            ]}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            initialValue={collaborator.pro_id ?? ""}
                            onSave={(value) =>
                              handleUpdateCollaborator(collaborator.id, {
                                pro_id: value,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {collaborator.initial_source ?? ""}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Tooltip content="Delete collaborator">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => handleDeleteClick(collaborator)}
                              >
                                <Icon icon="lucide:trash-2" />
                              </Button>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
              <div className="text-center py-8 border border-dashed rounded-lg border-default-200">
                <Icon
                  icon="lucide:users"
                  className="mx-auto mb-2 text-default-400"
                  width={32}
                  height={32}
                />
                <p className="text-default-500">No collaborators added yet</p>
                <p className="text-xs text-default-400 mt-1">
                  Add your first collaborator using the form above
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 mt-auto">
          <Button variant="flat" onPress={onBack} size="lg">
            Previous
          </Button>
          <Button color="primary" onPress={handleContinue} size="lg">
            Next
          </Button>
        </div>
      </div>
      <CollaboratorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        successCallback={() => {
          // Invalidate and refetch the collaborators query
          queryClient.invalidateQueries({
            queryKey: ["collaborators", organizationId],
          });
        }}
        showRelationshipSection={false}
      />
      <Modal
        isOpen={deleteWarningModal.isOpen}
        onClose={handleDeleteCancel}
        classNames={{
          base: "max-w-md",
        }}
      >
        <ModalContent>
          <ModalHeader>Delete Collaborator</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Icon
                  icon="lucide:alert-triangle"
                  className="text-warning mt-0.5 flex-shrink-0"
                  width={20}
                  height={20}
                />
                <div>
                  <p>
                    Are you sure you want to delete{" "}
                    <span className="font-semibold">
                      {deleteWarningModal.collaboratorToDelete?.legal_name ||
                        deleteWarningModal.collaboratorToDelete?.artist_name}
                    </span>
                    ? They will be removed from songs as well.
                  </p>
                </div>
              </div>

              {hasOtherCollaborators() && (
                <div className="space-y-3">
                  <Checkbox
                    isSelected={deleteWarningModal.showReplacementOption}
                    onValueChange={(checked) => {
                      setDeleteWarningModal((prev) => ({
                        ...prev,
                        showReplacementOption: checked,
                        replacementMode: checked && !!prev.selectedReplacement,
                        selectedReplacement: checked
                          ? prev.selectedReplacement
                          : null,
                      }));
                    }}
                  >
                    <p className="mb-2 text-small text-default-600 mt-4">
                      Would you like to replace this collaborator with someone
                      else?
                    </p>
                  </Checkbox>

                  {deleteWarningModal.showReplacementOption && (
                    <div className="ml-6 space-y-2">
                      <CollaboratorSingleSelect
                        defaultSelected={deleteWarningModal.selectedReplacement}
                        setSelected={(collaborator) => {
                          setDeleteWarningModal((prev) => ({
                            ...prev,
                            selectedReplacement: collaborator,
                            replacementMode: !!collaborator,
                          }));
                        }}
                        placeholder="Search collaborators..."
                        title="Select a replacement collaborator"
                        variant="compact"
                      />
                    </div>
                  )}
                </div>
              )}

              {!hasOtherCollaborators() && (
                <p className="text-xs text-default-400">
                  No other collaborators available for replacement
                </p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleDeleteCancel}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteConfirm}
              isDisabled={
                deleteWarningModal.showReplacementOption &&
                !deleteWarningModal.selectedReplacement
              }
            >
              {deleteWarningModal.showReplacementOption
                ? "Replace"
                : "Yes, delete this collaborator"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
