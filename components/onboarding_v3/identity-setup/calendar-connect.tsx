import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Card,
  CardBody,
  Select,
  SelectItem,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { FcGoogle } from "react-icons/fc";
import { useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { EditableCell } from "../editable-cell";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { OnboardingFormData } from "@/components/types/onboarding";
import { Collaborator, fetchCollaborators, updateCollaborator } from "@/lib/api/collaborators";
import { useGoogleAuthStore } from "@/lib/google-auth-store";

interface CalendarConnectProps {
  onboardingData: OnboardingFormData;
  onPendingStateChange?: (pending: boolean) => void;
  saveOnboardingData: (data: OnboardingFormData) => void;
  onCalendarSelectionChange?: (hasSelection: boolean, calendarName?: string) => void;
  shouldTriggerImport?: boolean;
  onImportComplete?: () => void;
}

export const CalendarConnect: React.FC<CalendarConnectProps> = ({
  onboardingData,
  onPendingStateChange,
  saveOnboardingData,
  onCalendarSelectionChange,
  shouldTriggerImport,
  onImportComplete,
}) => {
  // Use global store for session ID (survives re-mounts)
  const { sessionId: googleSessionId, setSessionId: setGoogleSessionId, clear: clearGoogleAuth } = useGoogleAuthStore();
  
  // Initialize global store from onboarding data if not already set
  useEffect(() => {
    if (!googleSessionId && onboardingData.googleSessionId) {
      console.log('Restoring session from onboarding data');
      setGoogleSessionId(onboardingData.googleSessionId);
    }
  }, [onboardingData.googleSessionId]);
  
  // Local state for calendars and UI
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<any>(new Set([]));
  const [hasImported, setHasImported] = useState(false);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const queryClient = useQueryClient();

  const pageSize = 50;

  // Infinite query for calendar collaborators using backend filtering
  const calendarCollaboratorsQuery = useInfiniteQuery({
    queryKey: ["calendar-collaborators", organizationId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId) return { collaborators: [], total: 0 };
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      const result = await fetchCollaborators({
        token,
        limit: pageSize,
        offset: pageParam * pageSize,
        initialSource: "calendar", // Filter for calendar collaborators only
      });
      
      return result;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total || 0;
      const loadedCount = allPages.reduce((sum, page) => sum + (page.collaborators?.length || 0), 0);
      return loadedCount < total ? allPages.length : undefined;
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Get all collaborators from all pages
  const importedCollaborators = useMemo(() => {
    return calendarCollaboratorsQuery.data?.pages.flatMap(page => page.collaborators || []) || [];
  }, [calendarCollaboratorsQuery.data]);

  const sharingCalendar = useMutation({
    mutationKey: ["shareCalendar"],
    mutationFn: async (calendarData: { calendarId: string }) => {
      // Get the backend auth token
      const token = await getToken({ template: "bard-backend" });
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";
      
      // First, call the /calendar/share endpoint
      const shareResponse = await axios.post(
        `${API_BASE_URL}/calendar/share`,
        {
          calendar_id: calendarData.calendarId,
          session_id: googleSessionId
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // If share is successful, then call the extract endpoint
      if (shareResponse.status === 200) {
        const extractResponse = await axios.post(
          `${API_BASE_URL}/calendar/extract`,
          {
            calendar_id: calendarData.calendarId,
            session_id: googleSessionId
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return extractResponse;
      } else {
        throw new Error('Calendar sharing failed');
      }
    },
    onSuccess: (response) => {
      // Mark as imported
      setHasImported(true);
      
      // Update parent about the import status
      if (onCalendarSelectionChange) {
        onCalendarSelectionChange(false, "");
      }
      
      // Invalidate and refetch the calendar collaborators query
      queryClient.invalidateQueries({ queryKey: ["calendar-collaborators", organizationId] });
    },
  });

  const updateCollaboratorMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error('No auth token available');
      }

      return await updateCollaborator({
        token,
        id,
        updates,
      });
    },
    onSuccess: () => {
      // Invalidate and refetch the calendar collaborators query
      queryClient.invalidateQueries({ queryKey: ["calendar-collaborators", organizationId] });
    },
  });

  const handleImport = () => {
    const selectedCalendarId = Array.from(selectedCalendar)[0];
    if (!selectedCalendarId) {
      return;
    }
    sharingCalendar.mutate({ calendarId: selectedCalendarId as string });
  };

  // Effect to handle import trigger from parent modal
  useEffect(() => {
    if (shouldTriggerImport && selectedCalendar.size > 0 && !sharingCalendar.isPending) {
      handleImport();
      
      // Notify parent that import is complete
      if (onImportComplete) {
        onImportComplete();
      }
    }
  }, [shouldTriggerImport]);

  const openGoogleLogin = async () => {
    try {
      // Get auth token for backend
      const token = await getToken({ template: "bard-backend" });
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";
      
      // Ensure token is a string (getToken might return null)
      const tokenString = token || '';
      
      if (!tokenString) {
        console.error('No auth token available');
        alert('Authentication required. Please sign in first.');
        return;
      }
      
      // Open backend Google auth endpoint
      const url = `${API_BASE_URL}/auth/google/authorize?token=${encodeURIComponent(tokenString)}`;
      
      window.open(
        url,
        "_blank",
        "width=1000,height=1000"
      );
    } catch (error) {
      console.error('Error opening Google login:', error);
      alert('Failed to open Google authorization. Please try again.');
    }
  };

  const handleUpdateCollaborator = (
    id: string,
    updates: Record<string, any>
  ) => {
    // Call the API to update collaborator in database
    updateCollaboratorMutation.mutate({ id, updates });
  };
  
  // Fetch calendars from backend when session ID is set
  useEffect(() => {
    if (googleSessionId && calendars.length === 0) {
      fetchCalendars();
    }
  }, [googleSessionId]);
  
  const fetchCalendars = async () => {
    if (!googleSessionId) return;
    
    setIsLoadingCalendars(true);
    try {
      const token = await getToken({ template: "bard-backend" });
      const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";
      
      const response = await axios.post(
        `${API_BASE_URL}/calendar/list`,
        { session_id: googleSessionId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.calendars) {
        setCalendars(response.data.calendars);
      }
    } catch (error) {
      console.error("Error fetching calendars:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Session expired or invalid
        clearGoogleAuth();
        setCalendars([]);
        alert('Session expired. Please sign in with Google again.');
      }
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle new backend response format
      if (event.data.type === 'google-auth-success') {
        // Store session ID in global store
        setGoogleSessionId(event.data.sessionId);
        
        // Store session ID in onboarding data for persistence across steps
        if (saveOnboardingData) {
          saveOnboardingData({
            ...onboardingData,
            googleSessionId: event.data.sessionId,
          });
        }
        
        // Set initial calendars if provided (will fetch fresh list from backend)
        if (event.data.calendars) {
          if (Array.isArray(event.data.calendars.items)) {
            setCalendars(event.data.calendars.items);
          } else if (Array.isArray(event.data.calendars)) {
            setCalendars(event.data.calendars);
          }
        }
      } else if (event.data.type === 'google-auth-error') {
        console.error("Google auth failed:", event.data.error);
      } else if (Array.isArray(event.data.items)) {
        // Legacy format support
        setCalendars(event.data.items);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [saveOnboardingData]);

  // Notify parent of pending state changes
  useEffect(() => {
    const isPending = sharingCalendar.isPending || updateCollaboratorMutation.isPending;
    onPendingStateChange?.(isPending);
  }, [sharingCalendar.isPending, updateCollaboratorMutation.isPending, onPendingStateChange]);

  return (
    <div className="h-full flex flex-col relative">
      <Card className="absolute w-full h-full flex-1 mt-4 z-0">
        <CardBody className="flex flex-col space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100">
              <Icon
                icon="lucide:calendar"
                width={32}
                height={32}
                className="text-blue-600"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium">Connect Calendar</h3>
              <p className="text-default-500 text-sm">
                  The application will access your calendar events. 
                  You can revoke access at any time from your account
                  settings.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Select
              isRequired
              errorMessage={"Please select a calendar to share"}
              isInvalid={selectedCalendar.size === 0}
              value={selectedCalendar}
              className="flex-1"
              label="Select a calendar to share"
              onSelectionChange={(selection) => {
                setSelectedCalendar(selection);
                setHasImported(false); // Reset import status when selection changes
                
                // Notify parent about calendar selection
                if (onCalendarSelectionChange) {
                  const selectedId = Array.from(selection)[0] as string;
                  const selectedCalendarObj = calendars.find(c => c.id === selectedId);
                  const hasSelection = Array.from(selection).length > 0;
                  onCalendarSelectionChange(
                    hasSelection && !hasImported,
                    selectedCalendarObj?.summary
                  );
                }
              }}
            >
              {calendars.map((calendar) => (
                <SelectItem
                  key={calendar.id}
                  startContent={
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: calendar.backgroundColor,
                        }}
                      />
                    </div>
                  }
                >
                  {calendar.summary}
                </SelectItem>
              ))}
            </Select>

              <Button
                disabled={sharingCalendar.isPending}
                color="success"
                variant="flat"
                isLoading={sharingCalendar.isPending}
                startContent={
                  sharingCalendar.isPending ? null : (
                    <Icon icon="lucide:share-2" />
                  )
                }
                onPress={handleImport}
                className="w-full h-[48px]"
              >
                {sharingCalendar.isPending ? "Sharing ..." : "Share and Import"}
              </Button>
          </div>
          {selectedCalendar && (
            <div className="bg-default-50 rounded-medium p-4 text-small">
              <div className="flex items-start gap-3">
                <Icon icon="lucide:info" className="text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Sharing permissions</p>
                  <p className="text-default-500 mt-1">
                    Connect your org/artist calendar for us to pull session and
                    collaborator data. You can also schedule sessions on Bard
                    which will sync with your catalog. You can change the linked
                    calendar later if you wish.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="h-full border">
            {importedCollaborators.length === 0 ? (
              <div className="flex items-center justify-center h-full p-4 text-default-500">
                <p className="text-sm">No calendar collaborators found</p>
              </div>
            ) : (
              <Table
                aria-label="Collaborators table"
                removeWrapper
                classNames={{
                  wrapper: "shadow-none",
                }}
              >
                <TableHeader>
                  <TableColumn>LEGAL NAME</TableColumn>
                  <TableColumn>ARTIST NAME</TableColumn>
                  <TableColumn>EMAIL</TableColumn>
                </TableHeader>
                <TableBody>
                  {importedCollaborators.map((collaborator) => (
                    <TableRow key={collaborator.id}>
                      <TableCell>
                        <EditableCell
                          initialValue={collaborator.legal_name ?? ""}
                          onSave={(value) => {
                            handleUpdateCollaborator(collaborator.id, { legal_name: value });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          initialValue={collaborator.artist_name ?? ""}
                          onSave={(value) => {
                            handleUpdateCollaborator(collaborator.id, { artist_name: value });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          initialValue={collaborator.email ?? ""}
                          onSave={(value) => {
                            handleUpdateCollaborator(collaborator.id, { email: value });
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardBody>
      </Card>

      {isLoadingCalendars && (
        <div
          className="absolute w-full h-full top-4 rounded-2xl
         bg-white/40 backdrop-blur-md
         backdrop-saturate-200 flex flex-col items-center justify-center"
        >
          <Card className="z-10 mx-auto w-full max-w-md bg-background/80 p-8 backdrop-blur-xl">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100/50 text-primary-500">
                <Icon icon="lucide:loader-2" width={32} height={32} className="animate-spin" />
              </div>
              <p className="text-medium text-foreground-500">Loading your calendars...</p>
            </div>
          </Card>
        </div>
      )}

      {(calendars.length === 0 && !isLoadingCalendars) && (
        <div
          className="absolute w-full h-full top-4 rounded-2xl
         bg-white/40 backdrop-blur-md
         backdrop-saturate-200 flex flex-col items-center justify-center"
        >
          <Card className="z-10 mx-auto w-full max-w-md bg-background/80 p-8 backdrop-blur-xl">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100/50 text-primary-500">
                <Icon icon="lucide:calendar" width={32} height={32} />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  Connect Your Calendar
                </h1>
                <p className="text-medium text-foreground-500">
                  The application will access your calendar events. 
                  You can revoke access at any time from your account
                  settings.
                </p>
              </div>

              <div className="w-full pt-4">
                <Button
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 shadow-sm hover:bg-gray-100 text-sm font-medium bg-white text-gray-700"
                  onPress={openGoogleLogin}
                >
                  <FcGoogle className="text-xl" />
                  Sign in with Google to connect your calendar
                </Button>

                <div className="mt-4 flex items-center justify-center gap-1 text-tiny text-foreground-400">
                  <Icon icon="lucide:shield-check" className="text-success" />
                  <span>Your data is secure and private</span>
                  <Tooltip content="We only access calendar events. No personal data is stored.">
                    <button className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground-100 text-foreground-500">
                      <Icon icon="lucide:info" width={12} height={12} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
