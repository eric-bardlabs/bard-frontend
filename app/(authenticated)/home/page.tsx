"use client";
import { useQueries } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useRouter } from "next/navigation";
import { useOrganization, useUser, useAuth } from "@clerk/nextjs";
import { fetchTracks } from "@/lib/api/tracks";
import { fetchCollaborators } from "@/lib/api/collaborators";
import { fetchSessions } from "@/lib/api/sessions";
import "./home.css";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  ScrollShadow,
  Card,
  CardBody,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { ChevronRight } from "lucide-react"; // Assuming you are using lucide-react for icons
import SessionReminderCard from "@/components/home/session-reminder-card";
import RecentReleasedCard from "@/components/home/recentReleasedCard";
import GlobalSearch from "@/components/home/globalSearch";
import { SongTasks } from "@/components/home/songTasks";
import { ValuationCard } from "@/components/home/valuation-card";
import { ValuationEstimator } from "@/components/home/valuation-estimator";


const HomePage = () => {
  const { user } = useUser();
  const router = useRouter();
  const { getToken } = useAuth();

  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const [isValuationEstimatorOpen, setIsValuationEstimatorOpen] = useState(false);


  const [collaboratorsCountQuery, myTracksCountQuery, recentAndUpcomingSessionsQuery] =
    useQueries({
      queries: [
        {
          queryFn: async () => {
            const token = await getToken({ template: "bard-backend" });
            if (!token) throw new Error("No auth token");
            return fetchCollaborators({
              token,
              limit: 1,
              offset: 0,
            });
          },
          queryKey: ["myCollaborators"],
          enabled: !!organizationId,
        },
        {
          queryFn: async () => {
            const token = await getToken({ template: "bard-backend" });
            if (!token) throw new Error("No auth token");
            return fetchTracks({
              token,
              limit: 1,
              offset: 0,
            });
          },
          queryKey: ["myTracks"],
          enabled: !!organizationId,
        },
        {
          queryFn: async () => {
            const token = await getToken({ template: "bard-backend" });
            if (!token) throw new Error("No auth token");
            
            // Calculate date range from 3 days past to 7 days future
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            return fetchSessions({
              token,
              start_time_from: threeDaysAgo.toISOString(),
              start_time_to: nextWeek.toISOString(),
              limit: 100,
            });
          },
          queryKey: ["recentAndUpcomingSessions"],
          enabled: !!organizationId,
        },
      ],
    });

  const collaboratorsCount = collaboratorsCountQuery?.data?.total ?? 0;
  const trackCount = myTracksCountQuery?.data?.total ?? 0;
  
  // Divide sessions into upcoming and recent finished
  const allSessions = recentAndUpcomingSessionsQuery?.data?.sessions ?? [];
  const now = new Date();
  const upcomingSessions = allSessions.filter(session => new Date(session.start_time) > now);
  const recentFinishedSessions = allSessions.filter(session => new Date(session.start_time) <= now);
  const upcomingSessionsCount = upcomingSessions.length;

  const isLoading =
    collaboratorsCountQuery.isLoading ||
    myTracksCountQuery.isLoading ||
    recentAndUpcomingSessionsQuery.isLoading

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      <Navbar
        className="py-2 md:py-0 lg:backdrop-filter-none max-w-full justify-between sticky top-[72px] md:top-0 bg-white !h-auto"
        classNames={{
          wrapper:
            "max-w-full md:flex-nowrap md:flex-row flex-col items-start md:items-center px-4 gap-2",
        }}
      >
        <NavbarBrand>
          <h1 className="font-bold text-inherit text-3xl">
            Welcome, {user?.firstName || "Bard User"} {user?.lastName || ""}
          </h1>
        </NavbarBrand>
        {/* Right Menu */}
        <NavbarContent className="w-full md:max-w-fit flex flex-row !justify-between items-center gap-0 max-w-full">
          {/* Search */}
          <NavbarItem className="flex w-full">
            <GlobalSearch organizationId={organizationId} />
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="flex w-full justify-center md:mt-2 mt-4 px-2">
        <ScrollShadow
          hideScrollBar
          className="flex w-full max-w-full justify-between gap-8 px-2"
          orientation="vertical"
        >
          <div className="w-full flex flex-col gap-4">
            <div>
              <div className="mt-8 md:mt-0 pb-4">
                <p className="text-2xl font-normal">Your Insights</p>
              </div>
              <div className="flex flex-wrap flex-row justify-start gap-5 w-full">
                <Card
                  className="md:w-96 w-full"
                  shadow="sm"
                  isPressable
                  isHoverable
                  onPress={() => router.push("/songs")}
                >
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {/* Icon with background */}
                        <div className="bg-gray-400 rounded-full w-10 h-10 flex justify-center items-center">
                          <Icon icon="lucide:music" width={24} />
                        </div>
                        <div className="ml-3">
                          {/* Middle Section (Number and Text) */}
                          <div className="text-xl font-bold">
                            {trackCount}
                          </div>
                          <div className="text-sm text-gray-500">
                            Tracks in Catalog
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={24} className="text-gray-500" />
                    </div>
                  </CardBody>
                </Card>
                <Card
                  className="md:w-96 w-full"
                  shadow="sm"
                  isPressable
                  isHoverable
                  onPress={() => router.push("/collaborators")}
                >
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {/* Icon with background */}
                        <div className="bg-gray-400 rounded-full w-10 h-10 flex justify-center items-center">
                          <Icon icon="lucide:users" width={24} />
                        </div>
                        <div className="ml-3">
                          {/* Middle Section (Number and Text) */}
                          <div className="text-xl font-bold">
                            {collaboratorsCount}
                          </div>
                          <div className="text-sm text-gray-500">
                            Collaborators
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={24} className="text-gray-500" />
                    </div>
                  </CardBody>
                </Card>
                <Card
                  className="md:w-96 w-full"
                  shadow="sm"
                  isPressable
                  isHoverable
                  onPress={() => router.push("/sessions")}
                >
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {/* Icon with background */}
                        <div className="w-10 h-10 flex justify-center items-center">
                          <Icon
                            className="text-default-500"
                            icon="solar:sort-by-time-linear"
                            width={40}
                          />
                        </div>
                        <div className="ml-3">
                          {/* Middle Section (Number and Text) */}
                          <div className="text-xl font-bold">
                            {upcomingSessionsCount}
                          </div>
                          <div className="text-sm text-gray-500">
                            Upcoming Sessions
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={24} className="text-gray-500" />
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
            <div className="flex lg:flex-row gap-4 flex-col">
              <div className="flex-[2] flex flex-col gap-4">
                <Card className="p-4">
                  <SongTasks />
                </Card>
                <Card className="p-4">
                  <RecentReleasedCard />
                </Card>
              </div>
              <div className="flex-[1] flex-col gap-4">
                <Card className="p-4">
                  <SessionReminderCard 
                    upcomingSessions={upcomingSessions}
                    recentFinishedSessions={recentFinishedSessions}
                  />
                </Card>
                <Card className="p-4 mt-6 w-full" isPressable onPress={() => setIsValuationEstimatorOpen(true)}>
                  <ValuationCard onOpen={() => setIsValuationEstimatorOpen(true)} />
                </Card>
              </div>
            </div>
          </div>
        </ScrollShadow>
      </main>

      <ValuationEstimator
        isOpen={isValuationEstimatorOpen}
        onOpenChange={setIsValuationEstimatorOpen}
      />
    </div>
  );
};

export default HomePage;
