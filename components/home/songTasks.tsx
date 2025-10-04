import React, { useMemo, useEffect } from "react";
import { Tabs, Tab, Card, CardBody, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MissingInfoTaskItem } from "@/components/home/missingInfoTaskItem";
import { MissingCollaboratorInfoTaskItem } from "@/components/home/missingCollaboratorInfoTaskItem";
import { MissingSplitsTaskItem } from "@/components/home/missingSplitsTaskItem";
import { ConfirmSplitsTaskItem } from "@/components/home/confirmSplitsTaskItem";
import { useAuth } from "@clerk/nextjs";
import { refreshReminders } from "@/lib/api/reminders";
import { toast } from "sonner";

export const SongTasks = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const backendHost =
    process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL ||
    "http://localhost:8000";
  const songsQuery = useQuery({
    queryKey: ["songTasks"],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });

      const response = await fetch(`${backendHost}/reminders/song_tasks?limit=200`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("Failed to get authentication token");
      }
      await refreshReminders(token);
      await queryClient.invalidateQueries({ queryKey: ["songTasks"] });
      toast.success("Reminders refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh reminders:", error);
      toast.error("Failed to refresh reminders");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh reminders when component mounts (user lands on home page)
  useEffect(() => {
    const refreshOnMount = async () => {
      try {
        const token = await getToken({ template: "bard-backend" });
        if (!token) {
          console.error("Failed to get authentication token for auto-refresh");
          return;
        }
        await refreshReminders(token);
        await queryClient.invalidateQueries({ queryKey: ["songTasks"] });
      } catch (error) {
        console.error("Failed to auto-refresh reminders:", error);
      }
    };
    
    refreshOnMount();
  }, []); // Empty dependency array means this runs once on mount

  const songs = useMemo(() => {
    if (songsQuery.isLoading) return [];
    if (songsQuery.isError) {
      console.error(songsQuery.error);
      return [];
    }
    return songsQuery.data?.reminders ?? [];
  }, [songsQuery.data, songsQuery.isLoading, songsQuery.isError]);
  // Filter tasks based on selected category and completion status
  const filteredSongTasks = useMemo(() => {
    // Filter out completed reminders
    const pendingTasks = songs.filter((task) => task.status !== "completed");

    if (selectedCategory === "all") {
      return pendingTasks;
    }
    return pendingTasks.filter((task) => task.type === selectedCategory);
  }, [songs, selectedCategory]);
  // Count tasks by type (only pending tasks)
  const pendingTasks = songs.filter((task) => task.status !== "completed");
  const missingSplitsCount = pendingTasks.filter(
    (task) => task.type === "missingSplits"
  ).length;
  const confirmSplitsCount = pendingTasks.filter(
    (task) => task.type === "confirmSplits"
  ).length;
  const missingInfoCount = pendingTasks.filter(
    (task) => task.type === "missingInfo"
  ).length;
  const missingCollaboratorInfoCount = pendingTasks.filter(
    (task) => task.type === "missingCollaboratorInfo"
  ).length;
  const allPendingCount = pendingTasks.length;

  const perPage = 10;
  const [page, setPage] = React.useState(1);
  const totalPages = useMemo(() => {
    setPage(1); // Reset page when tasks change
    return Math.ceil(filteredSongTasks.length / perPage);
  }, [filteredSongTasks.length, perPage]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Tasks for You</h2>
            <p className="text-sm text-default-500 mt-1">
              Complete these to ensure your collaborators and songs are set up correctly
            </p>
          </div>
          <Button
            size="sm"
            variant="flat"
            startContent={
              isRefreshing ? (
                <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
              ) : (
                <Icon icon="lucide:refresh-cw" className="h-4 w-4" />
              )
            }
            onPress={handleRefresh}
            isDisabled={isRefreshing}
            className="min-w-fit"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <Tabs
          aria-label="Song Task Categories"
          selectedKey={selectedCategory}
          onSelectionChange={(key) => setSelectedCategory(key as string)}
          variant="bordered"
          size="md"
          classNames={{
            tabList: "gap-1 w-full lg:w-auto bg-default-100/50 p-1",
            cursor: "bg-white shadow-sm",
            tab: "px-3 h-9",
            tabContent: "group-data-[selected=true]:text-primary font-medium"
          }}
        >
          <Tab
            key="all"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:list-checks" className="h-4 w-4" />
                <span>All Tasks</span>
                {allPendingCount > 0 && (
                  <Chip size="sm" variant="flat" classNames={{
                    base: "h-5 px-1.5 bg-default-200",
                    content: "text-xs font-semibold"
                  }}>
                    {allPendingCount}
                  </Chip>
                )}
              </div>
            }
          />
          <Tab
            key="missingSplits"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:pie-chart" className="h-4 w-4" />
                <span>Splits</span>
                {missingSplitsCount > 0 && (
                  <Chip size="sm" color="warning" variant="flat" classNames={{
                    base: "h-5 px-1.5",
                    content: "text-xs font-semibold"
                  }}>
                    {missingSplitsCount}
                  </Chip>
                )}
              </div>
            }
          />
          <Tab
            key="confirmSplits"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:check-circle" className="h-4 w-4" />
                <span>Confirm</span>
                {confirmSplitsCount > 0 && (
                  <Chip size="sm" color="success" variant="flat" classNames={{
                    base: "h-5 px-1.5",
                    content: "text-xs font-semibold"
                  }}>
                    {confirmSplitsCount}
                  </Chip>
                )}
              </div>
            }
          />
          <Tab
            key="missingInfo"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:music-2" className="h-4 w-4" />
                <span>Song Info</span>
                {missingInfoCount > 0 && (
                  <Chip size="sm" color="primary" variant="flat" classNames={{
                    base: "h-5 px-1.5",
                    content: "text-xs font-semibold"
                  }}>
                    {missingInfoCount}
                  </Chip>
                )}
              </div>
            }
          />
          <Tab
            key="missingCollaboratorInfo"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:users" className="h-4 w-4" />
                <span>Collaborators</span>
                {missingCollaboratorInfoCount > 0 && (
                  <Chip size="sm" color="secondary" variant="flat" classNames={{
                    base: "h-5 px-1.5",
                    content: "text-xs font-semibold"
                  }}>
                    {missingCollaboratorInfoCount}
                  </Chip>
                )}
              </div>
            }
          />
        </Tabs>
      </div>

      {songsQuery.isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Icon
            icon="lucide:loader"
            className="animate-spin h-6 w-6 text-gray-500"
          />
        </div>
      ) : filteredSongTasks.length > 0 ? (
        <div className="space-y-2">
          {filteredSongTasks.slice(0, page * perPage).map((songTask) => {
            switch (songTask.type) {
              case "missingCollaboratorInfo": {
                return (
                  <MissingCollaboratorInfoTaskItem
                    key={`${songTask.id}-${songTask.type}`}
                    task={songTask}
                  />
                );
              }
              case "missingSplits": {
                return (
                  <MissingSplitsTaskItem
                    task={songTask}
                  />
                );
              }
              case "confirmSplits": {
                return (
                  <ConfirmSplitsTaskItem
                    task={songTask}
                  />
                );
                // return null;
              }
              case "missingInfo": {
                return (
                  <MissingInfoTaskItem
                    key={`${songTask.id}-${songTask.type}`}
                    task={songTask}
                  />
                );
              }
              default:
                return null;
            }
          })}
          {page < totalPages && (
            <div className="flex items-center justify-center mt-4">
              <Button
                variant="light"
                size="md"
                color="primary"
                onPress={() => setPage((prevPage) => prevPage + 1)}
                endContent={
                  <Icon 
                    icon="lucide:chevron-down" 
                    className="h-4 w-4"
                  />
                }
                className="font-medium"
              >
                Show more
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-success/5 to-transparent border-success/20">
          <CardBody className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="rounded-full bg-success/10 p-3 mx-auto mb-3 w-fit">
                <Icon
                  icon="lucide:check-circle-2"
                  className="h-8 w-8 text-success"
                />
              </div>
              <p className="text-lg font-medium text-default-700 mb-1">
                All caught up!
              </p>
              <p className="text-sm text-default-500">
                No pending tasks in {selectedCategory === "all" ? "your catalog" : "this category"}.
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
