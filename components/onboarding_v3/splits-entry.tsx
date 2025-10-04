import React from "react";
import {
  Button,
  Spacer,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { SongSplitsTable } from "./song-splits-table";
import { Track, fetchTracks } from "@/lib/api/tracks";
import { Collaborator } from "@/lib/api/collaborators";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface SplitsEntryProps {
  onNext: () => void;
  onBack: () => void;
}

export const SplitsEntry: React.FC<SplitsEntryProps> = ({
  onNext,
  onBack,
}) => {
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const queryClient = useQueryClient();

  // Fetch tracks that need confirmation - limit to 10
  const { data: tracksData, isLoading, refetch } = useQuery({
    queryKey: ["tracks-splits-confirmation", organizationId],
    queryFn: async () => {
      if (!organizationId) return { tracks: [], total: 0 };
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      // Fetch tracks with specific status that need confirmation
      const result = await fetchTracks({
        token,
        limit: 10, // Cap at 10 tracks as requested
        offset: 0,
        splitsConfirmationStatus: "NEEDS_CONFIRMATION_ONBOARDING",
      });
      
      return result;
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const tracksNeedsConfirmation = tracksData?.tracks || [];

  const handleReviewProject = () => {
    onNext();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container mx-auto py-8 px-4 flex-grow">
        <h1 className="text-2xl font-semibold mb-2">Splits Mapping</h1>
        <p className="text-default-500 mb-6">
          Please review the sample splits from your spreadsheets below and
          confirm them—correcting any percentages as needed. Your updates will
          train our AI to process the rest of your catalog; if you uploaded a
          CSV earlier, the AI will use these confirmed splits to better map the
          remaining ones, and you can confirm all splits after onboarding.{" "}
        </p>
        <Spacer y={2} />
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="md" />
            <span className="ml-2 text-default-500">
              Loading tracks that need confirmation...
            </span>
          </div>
        ) : (
          <SongSplitsTable
            songs={tracksNeedsConfirmation}
            refetchTrack={() => {
              refetch();
              queryClient.invalidateQueries({
                queryKey: ["tracks", organizationId],
              });
            }}
          />
        )}
        <div className="flex justify-between pt-4 mt-auto">
          <Button
            variant="flat"
            startContent={<Icon icon="lucide:arrow-left" />}
            onPress={onBack}
            size="lg"
          >
            Back to Songs
          </Button>
          <Button
            color="primary"
            endContent={<Icon icon="lucide:arrow-right" />}
            onPress={handleReviewProject}
            size="lg"
          >
            Review Project
          </Button>
        </div>
      </main>
    </div>
  );
};
