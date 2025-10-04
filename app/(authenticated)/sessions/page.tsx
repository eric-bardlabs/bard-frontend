"use client";
import React, { useState } from "react";
import {
  Tabs,
  Tab,
  Spinner,
  Button,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { fetchSessions } from "@/lib/api/sessions";
import { 
  Calendar, 
  Clock,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { SessionModal } from "@/components/calendar/session-modal";
import { SessionProvider, useSessionContext } from "@/components/calendar/session-provider";
import { SessionCard } from "@/components/sessions/SessionCard";
import { PastSessionModal } from "@/components/sessions/PastSessionModal";
import { Session } from "@/lib/api/sessions";

dayjs.extend(relativeTime);

const ITEMS_PER_PAGE = 10;

const SessionsPageContent = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { openNewSessionModal, openEditSessionModal, refreshSessions } = useSessionContext();
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [hasMoreUpcoming, setHasMoreUpcoming] = useState(true);
  const [hasMorePast, setHasMorePast] = useState(true);
  const [pastSessionModalOpen, setPastSessionModalOpen] = useState(false);
  const [selectedPastSessionId, setSelectedPastSessionId] = useState<string | null>(null);

  const now = new Date();
  
  // Query for upcoming sessions
  const upcomingSessionsQuery = useQuery({
    queryKey: ["sessions", "upcoming", upcomingPage],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const response = await fetchSessions({
        token,
        start_time_from: now.toISOString(),
        limit: ITEMS_PER_PAGE,
        offset: (upcomingPage - 1) * ITEMS_PER_PAGE,
      });
      
      setHasMoreUpcoming(response.has_more);
      
      if (upcomingPage === 1) {
        setUpcomingSessions(response.sessions);
      } else {
        setUpcomingSessions(prev => [...prev, ...response.sessions]);
      }
      
      return response;
    },
  });

  // Query for past sessions
  const pastSessionsQuery = useQuery({
    queryKey: ["sessions", "past", pastPage],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const response = await fetchSessions({
        token,
        start_time_to: now.toISOString(),
        limit: ITEMS_PER_PAGE,
        offset: (pastPage - 1) * ITEMS_PER_PAGE,
      });
      
      setHasMorePast(response.has_more);
      
      if (pastPage === 1) {
        setPastSessions(response.sessions);
      } else {
        setPastSessions(prev => [...prev, ...response.sessions]);
      }
      
      return response;
    },
  });

  const handleSessionClick = (session: Session) => {
    const startTime = session.start_time ? dayjs(session.start_time) : null;
    const isUpcoming = startTime && startTime.isAfter(dayjs());
    
    if (isUpcoming) {
      openEditSessionModal(session);
    } else {
      // For past sessions, open the past session modal
      setSelectedPastSessionId(session.id);
      setPastSessionModalOpen(true);
    }
  };

  const handleCreateSession = () => {
    openNewSessionModal();
  };

  // Refresh sessions when events are updated
  React.useEffect(() => {
    upcomingSessionsQuery.refetch();
    pastSessionsQuery.refetch();
  }, [refreshSessions]);

  const renderSessionsList = (
    sessions: Session[], 
    isLoading: boolean, 
    isLoadingMore: boolean,
    hasMore: boolean,
    onLoadMore: () => void,
    type: 'upcoming' | 'past'
  ) => {
    if (isLoading && sessions.length === 0) {
      return (
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" color="primary" />
        </div>
      );
    }

    if (!isLoading && (!sessions || sessions.length === 0)) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-center">
            {type === "upcoming" ? (
              <>
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No upcoming sessions</h3>
                <p className="text-sm text-gray-500">Schedule your next recording session</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No past sessions</h3>
                <p className="text-sm text-gray-500">Your completed sessions will appear here</p>
              </>
            )}
          </div>
          {type === "upcoming" && (
            <Button 
              color="primary" 
              startContent={<Plus className="w-4 h-4" />}
              onPress={handleCreateSession}
              className="bg-black text-white"
            >
              Schedule a Session
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onClick={() => handleSessionClick(session)}
          />
        ))}
        
        {hasMore && (
          <div className="flex justify-center pt-6">
            <Button
              variant="light"
              onPress={onLoadMore}
              isLoading={isLoadingMore}
              endContent={!isLoadingMore && <ChevronDown className="w-4 h-4" />}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              View More
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
              <p className="text-gray-500 mt-1">
                Manage your recording sessions and collaborations
              </p>
            </div>
            <Button 
              color="default"
              startContent={<Plus className="w-4 h-4" />}
              onPress={handleCreateSession}
              className="bg-black text-white hover:bg-gray-800"
            >
              New Session
            </Button>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <Tabs 
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            aria-label="Session tabs"
            variant="underlined"
            classNames={{
              base: "w-full",
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-gray-200 px-6",
              cursor: "w-full bg-black",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-black font-medium"
            }}
          >
            <Tab 
              key="upcoming" 
              title="Upcoming Sessions"
            >
              <div className="p-6">
                {renderSessionsList(
                  upcomingSessions,
                  upcomingSessionsQuery.isLoading && upcomingPage === 1,
                  upcomingSessionsQuery.isLoading && upcomingPage > 1,
                  hasMoreUpcoming,
                  () => setUpcomingPage(prev => prev + 1),
                  'upcoming'
                )}
              </div>
            </Tab>
            
            <Tab 
              key="past" 
              title="Past Sessions"
            >
              <div className="p-6">
                {renderSessionsList(
                  pastSessions,
                  pastSessionsQuery.isLoading && pastPage === 1,
                  pastSessionsQuery.isLoading && pastPage > 1,
                  hasMorePast,
                  () => setPastPage(prev => prev + 1),
                  'past'
                )}
              </div>
            </Tab>
          </Tabs>
        </div>

        {/* Past Session Modal */}
        {selectedPastSessionId && (
          <PastSessionModal
            isOpen={pastSessionModalOpen}
            onClose={() => {
              setPastSessionModalOpen(false);
              setSelectedPastSessionId(null);
            }}
            sessionId={selectedPastSessionId}
            onSessionUpdated={() => {
              upcomingSessionsQuery.refetch();
              pastSessionsQuery.refetch();
            }}
          />
        )}
      </div>
    </div>
  );
};

const SessionsPage = () => {
  return (
    <SessionProvider>
      <SessionsPageContent />
      <SessionModal />
    </SessionProvider>
  );
};

export default SessionsPage;