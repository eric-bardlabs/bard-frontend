"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardBody,
  Button,
  Breadcrumbs,
  BreadcrumbItem,
  Spinner,
  Chip,
  Avatar,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Music, 
  Users, 
  Edit3,
  FileText,
  StickyNote
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { SessionCollaborator, fetchSession } from "@/lib/api/sessions";
import { SessionProvider, useSessionContext } from "@/components/calendar/session-provider";
import { SessionModal } from "@/components/calendar/session-modal";
import { PastSessionModal } from "@/components/sessions/PastSessionModal";
import { Session, SessionTrack } from "@/lib/api/sessions";

dayjs.extend(relativeTime);

const SessionDetailContent = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params?.sessionId as string;
  const { getToken } = useAuth();
  const { openEditSessionModal, refreshSessions } = useSessionContext();
  
  const [pastSessionModalOpen, setPastSessionModalOpen] = useState(false);
  
  // Check for edit parameter in URL
  const shouldOpenEdit = searchParams?.get('edit') === 'true';

  // Fetch session data
  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      return fetchSession({ token, sessionId });
    },
    enabled: !!sessionId,
  });

  const session = sessionQuery.data;

  const handleEditSession = () => {
    if (!session) return;
    
    const startTime = session.start_time ? dayjs(session.start_time) : null;
    const isUpcoming = startTime && startTime.isAfter(dayjs());
    
    if (isUpcoming) {
      openEditSessionModal(session);
    } else {
      // For past sessions, open the past session modal
      setPastSessionModalOpen(true);
    }
  };

  // Auto-open edit modal if URL parameter is present
  useEffect(() => {
    if (shouldOpenEdit && session && !sessionQuery.isLoading) {
      handleEditSession();
      // Remove the edit parameter from URL to prevent reopening on refresh
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('edit');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [shouldOpenEdit, session, sessionQuery.isLoading]);

  // Refresh session data when SessionModal updates are made
  useEffect(() => {
    sessionQuery.refetch();
  }, [refreshSessions]);

  if (sessionQuery.isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    router.push("/sessions");
    return null;
  }

  const startTime = session.start_time ? dayjs(session.start_time) : null;
  const endTime = session.end_time ? dayjs(session.end_time) : null;
  const isUpcoming = startTime && startTime.isAfter(dayjs());
  const isUpcomingWithinWeek = startTime && startTime.isAfter(dayjs()) && startTime.isBefore(dayjs().add(7, 'days'));

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs className="mb-4">
            <BreadcrumbItem onClick={() => router.push("/sessions")}>
              Sessions
            </BreadcrumbItem>
            <BreadcrumbItem>{session.title || "Untitled Session"}</BreadcrumbItem>
          </Breadcrumbs>
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {session.title || "Untitled Session"}
                </h1>
                {isUpcomingWithinWeek && (
                  <Chip 
                    size="sm" 
                    color="success" 
                    variant="flat"
                    className="bg-emerald-50 text-emerald-600"
                  >
                    Upcoming
                  </Chip>
                )}
              </div>
              {session.description && (
                <p className="text-gray-600 mb-4">{session.description}</p>
              )}
            </div>
            
            <Button
              color="primary"
              startContent={<Edit3 className="w-4 h-4" />}
              onPress={handleEditSession}
              className="bg-black text-white hover:bg-gray-800 min-w-fit whitespace-nowrap"
            >
              {isUpcoming ? "Edit Session" : "Update Songs and Splits"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Session Details Card */}
          <Card className="shadow-sm">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                Session Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date & Time */}
                <div className="space-y-4">
                  {startTime && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{startTime.format("MMMM D, YYYY")}</p>
                      </div>
                    </div>
                  )}
                  
                  {startTime && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium">
                          {startTime.format("h:mm A")}
                          {endTime && ` - ${endTime.format("h:mm A")}`}
                        </p>
                        {startTime && (
                          <p className="text-xs text-gray-400">
                            {isUpcoming ? `in ${startTime.fromNow(true)}` : startTime.fromNow()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location & Notes */}
                <div className="space-y-4">
                  {session.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{session.location}</p>
                      </div>
                    </div>
                  )}
                  
                  {session.notes && (
                    <div className="flex items-start gap-3">
                      <StickyNote className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Notes</p>
                        <p className="font-medium">{session.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Songs Card */}
          {session.tracks && session.tracks.length > 0 && (
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-gray-500" />
                  Songs ({session.tracks.length})
                </h2>
                
                <div className="space-y-3">
                  {session.tracks.map((track: SessionTrack) => (
                    <div key={track.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Music className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium">{track.display_name || "Untitled"}</p>
                        {track.status && (
                          <p className="text-xs text-gray-500 capitalize">{track.status}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Collaborators Card */}
          {session.collaborators && session.collaborators.length > 0 && (
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  Collaborators ({session.collaborators.length})
                </h2>
                
                <div className="flex flex-wrap gap-4">
                  {session.collaborators.map((collab: SessionCollaborator) => (
                    <div key={collab.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar 
                        name={collab.artist_name || collab.legal_name}
                        size="sm"
                        className="w-10 h-10"
                      />
                      <div>
                        <p className="font-medium">
                          {collab.artist_name || collab.legal_name || "Unknown"}
                        </p>
                        {collab.email && (
                          <p className="text-xs text-gray-500">{collab.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Empty State */}
          {(!session.tracks || session.tracks.length === 0) && 
           (!session.collaborators || session.collaborators.length === 0) && (
            <Card className="shadow-sm">
              <CardBody className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No additional details</h3>
                <p className="text-gray-500 mb-4">
                  This session doesn't have any songs or collaborators assigned yet.
                </p>
                <Button
                  color="primary"
                  startContent={<Edit3 className="w-4 h-4" />}
                  onPress={handleEditSession}
                  className="bg-black text-white min-w-fit whitespace-nowrap"
                >
                  {isUpcoming ? "Add Details" : "Add Songs and Splits"}
                </Button>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Past Session Modal */}
        <PastSessionModal
          isOpen={pastSessionModalOpen}
          onClose={() => setPastSessionModalOpen(false)}
          sessionId={sessionId}
          onSessionUpdated={() => {
            sessionQuery.refetch();
          }}
        />
      </div>
    </div>
  );
};

const SessionDetailPage = () => {
  return (
    <SessionProvider>
      <SessionDetailContent />
      <SessionModal />
    </SessionProvider>
  );
};

export default SessionDetailPage;