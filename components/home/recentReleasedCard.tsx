import React from "react";
import {
  Button,
  Chip,
  Tooltip,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { fetchTracks, Track } from "@/lib/api/tracks";

interface RecentReleasedCardProps {}

const RecentReleasedCard: React.FC<RecentReleasedCardProps> = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const organizationId = organization?.id;

  // Fetch recent released tracks
  const { data: tracksData, isLoading, isError } = useQuery({
    queryKey: ["recentReleasedTracks", organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("No organization");
      
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      return fetchTracks({
        token,
        status: ["Released", "Release"],
        sortBy: "release_date",
        sortOrder: "desc",
        limit: 5,
        offset: 0,
      });
    },
    enabled: !!organizationId,
  });

  const recentReleasedTracks = tracksData?.tracks || [];

  const formatReleaseDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success-100 rounded-lg">
            <Icon icon="lucide:calendar-check" className="h-5 w-5 text-success-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-default-900">Recent Releases</h3>
            <p className="text-sm text-default-500">
              Your latest released tracks
            </p>
          </div>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          endContent={<Icon icon="lucide:arrow-right" className="h-4 w-4" />}
          onPress={() => router.push("/songs")}
        >
          View All Songs
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8">
          <Spinner size="sm" />
          <p className="text-sm text-default-500 mt-2">Loading recent releases...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="text-center py-8 border border-dashed rounded-lg border-danger-200">
          <Icon
            icon="lucide:alert-circle"
            className="mx-auto mb-2 text-danger-400"
            width={32}
            height={32}
          />
          <p className="text-danger-500">Failed to load recent releases</p>
          <p className="text-xs text-danger-400 mt-1">
            Please try again later
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && recentReleasedTracks.length === 0 && (
        <div className="text-center py-8 border border-dashed rounded-lg border-default-200">
          <Icon
            icon="lucide:music"
            className="mx-auto mb-2 text-default-400"
            width={32}
            height={32}
          />
          <p className="text-default-500">No released tracks yet</p>
          <p className="text-xs text-default-400 mt-1">
            Start releasing your music or update your catalog to see them here
          </p>
        </div>
      )}

      {/* Success state with tracks */}
      {!isLoading && !isError && recentReleasedTracks.length > 0 && (
        <div className="space-y-3">
          {recentReleasedTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-3 bg-default-50 rounded-lg hover:bg-default-100 transition-colors cursor-pointer"
              onClick={() => router.push(`/songs/${track.id}`)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-white rounded-md shadow-sm">
                  <Icon icon="lucide:music" className="h-4 w-4 text-success-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-default-900 truncate">
                    {track.display_name}
                  </p>
                  <p className="text-xs text-default-500 mt-1">
                    {track.release_date ? `Released ${formatReleaseDate(track.release_date)}` : "No release date"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Collaborators as chips */}
                {track.collaborators && track.collaborators.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {track.collaborators.slice(0, 3).map((collaborator) => (
                      <Tooltip
                        key={collaborator.id}
                        content={collaborator.artist_name || collaborator.legal_name || "Unknown"}
                        placement="top"
                      >
                        <Chip
                          size="sm"
                          variant="flat"
                          color="default"
                          className="text-xs max-w-[100px]"
                        >
                          <span className="truncate">
                            {collaborator.artist_name || collaborator.legal_name || "Unknown"}
                          </span>
                        </Chip>
                      </Tooltip>
                    ))}
                    {track.collaborators.length > 3 && (
                      <Chip
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="text-xs"
                      >
                        +{track.collaborators.length - 3}
                      </Chip>
                    )}
                  </div>
                )}

                <Icon icon="lucide:chevron-right" className="h-4 w-4 text-default-400 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentReleasedCard;