import React from "react";
import { Card, CardBody, Button, Divider, Alert, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ProjectSummary } from "./project-summary";
import { MetricCard } from ".//metric-card";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useOrganization, useUser, useAuth } from "@clerk/nextjs";
import { fetchTracks } from "@/lib/api/tracks";
import { fetchCollaborators } from "@/lib/api/collaborators";
import { STEPS } from "@/components/types/onboarding";

interface ReviewAndSaveProps {
  onNavigateToStep?: (stepId: number) => void;
}

export const ReviewAndSave: React.FC<ReviewAndSaveProps> = ({
  onNavigateToStep,
}) => {
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const { user } = useUser();
  const organizationId = organization?.id;

  const projectName = organization?.name || user?.fullName || "Untitled Project";

  // Fetch total tracks count
  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ["tracks-count", organizationId],
    queryFn: async () => {
      if (!organizationId) return { tracks: [], total: 0 };
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      return fetchTracks({
        token,
        limit: 1, // We only need the count, not the actual data
        offset: 0,
      });
    },
    enabled: !!organizationId,
  });

  // Fetch total collaborators count
  const { data: collaboratorsData, isLoading: collaboratorsLoading } = useQuery({
    queryKey: ["collaborators-count", organizationId],
    queryFn: async () => {
      if (!organizationId) return { collaborators: [], total: 0 };
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      return fetchCollaborators({
        token,
        limit: 1, // We only need the count, not the actual data
        offset: 0,
      });
    },
    enabled: !!organizationId,
  });

  // Fetch tracks with splits that need confirmation
  const { data: splitsTracksData, isLoading: splitsLoading } = useQuery({
    queryKey: ["tracks-splits-count", organizationId],
    queryFn: async () => {
      if (!organizationId) return { tracks: [], total: 0 };
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");

      return fetchTracks({
        token,
        limit: 1, // We only need the count, not the actual data
        offset: 0,
        splitsConfirmationStatus: "NEEDS_CONFIRMATION_ONBOARDING",
      });
    },
    enabled: !!organizationId,
  });

  const songsImported = tracksData?.total || 0;
  const collaboratorsImported = collaboratorsData?.total || 0;
  const songsWithSplits = splitsTracksData?.total || 0;
  const isLoading = tracksLoading || collaboratorsLoading || splitsLoading;

  const finishOnboarding = useMutation({
    mutationKey: ["finishOnboarding"],
    mutationFn: async () => {
      return axios.post("/api/onboarding/finish");
    },
    onSuccess: async (response) => {
      const host = window.location.protocol + "//" + window.location.host;
      window.location.href = `${host}/home`;
    },
    onError: (error) => {
      console.error("Error finishing onboarding:", error);
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4">
      <Card className="w-full max-w-3xl shadow-sm">
        <CardBody className="p-6">
          <div className="flex items-center mb-2">
            <Icon icon="lucide:music" className="text-primary text-xl mr-2" />
            <h1 className="text-xl font-semibold">
              Onboarding Summary
            </h1>
          </div>

          <p className="text-default-500 mb-6">
            {`Here's an overview of ${projectName}'s catalog`}
          </p>

          <Divider className="my-4" />

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="md" />
              <span className="ml-2 text-default-500">
                Loading project summary...
              </span>
            </div>
          ) : (
            <ProjectSummary
              songsImported={songsImported}
              totalSongs={songsImported}
              collaboratorsImported={collaboratorsImported}
            />
          )}

          <Alert 
            className="mt-8"
            title="Onboarding Complete!"
            color="success"
            description="You are ready to complete onboarding! We'll be extracting the rest of your CSV (helped by your confirmed examples) in the next day. You'll be notified on the home page to confirm the extractions once they're ready."
          />

          <Divider className="my-6" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="flat"
                  size="sm"
                  className="text-xs"
                  startContent={<Icon icon="lucide:music" width={14} />}
                  onPress={() => onNavigateToStep?.(STEPS.SONGS)}
                  isDisabled={isLoading}
                >
                  Review Songs
                  <span className="text-default-400 ml-1">
                    ({isLoading ? "..." : songsImported})
                  </span>
                </Button>
                
                <Button
                  variant="flat"
                  size="sm"
                  className="text-xs"
                  startContent={<Icon icon="lucide:users" width={14} />}
                  onPress={() => onNavigateToStep?.(STEPS.COLLABORATORS)}
                  isDisabled={isLoading}
                >
                  Review Collaborators
                  <span className="text-default-400 ml-1">
                    ({isLoading ? "..." : collaboratorsImported})
                  </span>
                </Button>
                
                <Button
                  variant="flat"
                  size="sm"
                  className="text-xs"
                  startContent={<Icon icon="lucide:percent" width={14} />}
                  onPress={() => onNavigateToStep?.(STEPS.SPLITS)}
                  isDisabled={isLoading}
                >
                  Review Splits
                  <span className="text-default-400 ml-1">
                    ({isLoading ? "..." : songsWithSplits})
                  </span>
                </Button>
              </div>
            </div>

            <Button
              color="primary"
              size="lg"
              onPress={() => finishOnboarding.mutate()}
              disabled={finishOnboarding.isPending}
              endContent={<Icon icon="lucide:arrow-right" />}
            >
              {finishOnboarding.isPending
                ? "Processing..."
                : "Go to Homepage"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
