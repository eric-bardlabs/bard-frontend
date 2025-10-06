"use client";

import { useOrganization, OrganizationProfile, useAuth } from "@clerk/nextjs";
import React from "react";
import { useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  Divider,
  CardBody,
  Alert,
  CardFooter,
  Select,
  SelectItem,
  Tooltip,
} from "@heroui/react";
import { FcGoogle } from "react-icons/fc";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { NotificationSettings } from "@/components/organizaions/notification-settings";
import { useGoogleAuthStore } from "@/lib/google-auth-store";

const CalendarSettings = () => {
  const { organization } = useOrganization();
  const { getToken } = useAuth();
  
  // Use global store for session ID (survives re-mounts)
  const { sessionId: googleSessionId, setSessionId: setGoogleSessionId, clear: clearGoogleAuth } = useGoogleAuthStore();
  
  // Local state for calendars (fetched from backend)
  const [calendars, setCalendars] = React.useState<any[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = React.useState(false);
  const [sharedCalendarInfo, setSharedCalendarInfo] = React.useState<{
    calendar_id?: string;
    calendar_name?: string;
    calendar_description?: string;
    calendar_timezone?: string;
    shared_at?: string;
  } | null>(null);
  const [isLoadingSharedInfo, setIsLoadingSharedInfo] = React.useState(true);
  
  const [selectedCalendar, setSelectedCalendar] = React.useState<any>(new Set([]));
  
  // Derive authentication state from having calendars and session
  const isAuthenticated = React.useMemo(() => {
    return googleSessionId !== null;
  }, [googleSessionId]);
  
  // Fetch shared calendar info on mount
  React.useEffect(() => {
    console.log("CalendarSettings mounted, sessionId from global store:", googleSessionId);
    fetchSharedCalendarInfo();
    return () => {
      console.log("CalendarSettings unmounting, but session persists in global store");
    };
  }, []);
  
  // Function to fetch shared calendar info
  const fetchSharedCalendarInfo = async () => {
    setIsLoadingSharedInfo(true);
    try {
      const token = await getToken({ template: "bard-backend" });
      const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";
      
      const response = await axios.get(
        `${API_BASE_URL}/calendar/shared-info`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.calendar_id) {
        setSharedCalendarInfo(response.data);
      }
    } catch (error) {
      console.error("Error fetching shared calendar info:", error);
    } finally {
      setIsLoadingSharedInfo(false);
    }
  };
  
  // Fetch calendars when session ID is set
  React.useEffect(() => {
    if (googleSessionId && calendars.length === 0) {
      console.log("Fetching calendars for session:", googleSessionId);
      fetchCalendars();
    }
  }, [googleSessionId]);
  
  // Pre-select shared calendar when calendars are loaded
  React.useEffect(() => {
    if (calendars.length > 0 && sharedCalendarInfo?.calendar_id && selectedCalendar.size === 0) {
      const sharedCalendarExists = calendars.some(
        (cal: any) => cal.id === sharedCalendarInfo.calendar_id
      );
      if (sharedCalendarExists) {
        console.log("Pre-selecting shared calendar:", sharedCalendarInfo.calendar_id);
        setSelectedCalendar(new Set([sharedCalendarInfo.calendar_id]));
      }
    }
  }, [calendars, sharedCalendarInfo]);
  
  // Function to fetch calendars from backend
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
        setStatus({
          type: "error",
          message: "Session expired. Please sign in with Google again."
        });
      }
    } finally {
      setIsLoadingCalendars(false);
    }
  };
  
  const [status, setStatus] = React.useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });


  // Handle Google OAuth messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Ignore messages from React DevTools and other sources
      if (event.data.source === 'react-devtools-bridge' || 
          event.data.source === 'react-devtools-content-script' ||
          event.data.source === 'react-devtools-backend-manager') {
        return;
      }
      
      // Only process messages with our expected auth types
      if (!event.data.type || 
          (event.data.type !== 'google-auth-success' && 
           event.data.type !== 'google-auth-error')) {
        return;
      }
      
      console.log("CalendarSettings received auth message:", event.data);
      
      if (event.data.type === 'google-auth-success') {
        console.log("Google auth success, received session ID from backend");
        
        // Store session ID in global store - backend manages the OAuth tokens securely
        const sessionId = event.data.sessionId;
        setGoogleSessionId(sessionId);
        
        // Calendars from the auth callback are just for immediate UI feedback
        // We'll fetch fresh calendar list from backend
        if (event.data.calendars) {
          const calendarsList = Array.isArray(event.data.calendars.items) 
            ? event.data.calendars.items 
            : Array.isArray(event.data.calendars) 
              ? event.data.calendars 
              : [];
          
          if (calendarsList.length > 0) {
            setCalendars(calendarsList);
          }
        }
      } else if (event.data.type === 'google-auth-error') {
        console.error("Google auth failed:", event.data.error);
        setStatus({
          type: "error",
          message: "Failed to authenticate with Google. Please try again."
        });
        // Clear global store
        clearGoogleAuth();
        setCalendars([]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Open Google OAuth window
  const openGoogleLogin = async () => {
    try {
      // Use frontend API route that will redirect to backend
      const url = `/api/auth/google/start`;
      
      window.open(
        url,
        "_blank",
        "width=1000,height=1000"
      );
    } catch (error) {
      console.error('Error opening Google login:', error);
      setStatus({
        type: "error",
        message: "Failed to open Google authorization. Please try again."
      });
    }
  };

  // Share calendar mutation
  const shareCalendarMutation = useMutation({
    mutationKey: ["shareCalendar"],
    mutationFn: async (calendarId: string) => {
      const token = await getToken({ template: "bard-backend" });
      const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";
      
      console.log("Mutation using sessionId:", googleSessionId);
      
      const response = await axios.post(
        `${API_BASE_URL}/calendar/share`,
        {
          calendar_id: calendarId,
          session_id: googleSessionId
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: async (data) => {
      setStatus({
        type: "success",
        message: data.already_shared 
          ? "Calendar was already shared with Bard Labs" 
          : "Calendar successfully shared with Bard Labs"
      });
      
      // Refresh shared calendar info to show updated details
      await fetchSharedCalendarInfo();
    },
    onError: (error: any) => {
      setStatus({
        type: "error",
        message: error.response?.data?.detail || "Failed to share calendar. Please try again."
      });
    }
  });

  const handleShareCalendar = (calendarId?: string) => {
    const selectedCalendarId = calendarId || Array.from(selectedCalendar)[0] as string;
    if (!selectedCalendarId) {
      setStatus({
        type: "error",
        message: "Please select a calendar to share"
      });
      return;
    }
    
    if (!googleSessionId) {
      setStatus({
        type: "error",
        message: "Please authenticate with Google first"
      });
      return;
    }

    shareCalendarMutation.mutate(selectedCalendarId);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-xl font-semibold">Calendar Settings</p>
          <p className="text-small text-default-500">
            Connect and share your Google Calendar with Bard Labs
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-6">

        {/* Loading state for shared calendar info */}
        {isLoadingSharedInfo && !isAuthenticated && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Icon icon="lucide:loader-2" className="animate-spin text-default-400" />
              <span className="text-sm text-default-500">Loading calendar settings...</span>
            </div>
          </div>
        )}

        {/* Display shared calendar info - only when not authenticated and loaded */}
        {!isLoadingSharedInfo && sharedCalendarInfo?.calendar_id && !isAuthenticated && (
          <div className="flex items-center justify-between py-4 px-6 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-12">
              <div>
                <p className="text-sm font-semibold text-gray-900">Current Shared Calendar</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                  <Icon icon="lucide:calendar-check" className="text-gray-600 text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{sharedCalendarInfo.calendar_name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {sharedCalendarInfo.calendar_timezone && (
                      <p className="text-xs text-gray-500">{sharedCalendarInfo.calendar_timezone}</p>
                    )}
                    {sharedCalendarInfo.shared_at && (
                      <p className="text-xs text-gray-500">
                        Shared {new Date(sharedCalendarInfo.shared_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="light"
              onPress={openGoogleLogin}
              startContent={<FcGoogle />}
            >
              Sign in with Google to change
            </Button>
          </div>
        )}

        {/* Google login button - show when not authenticated, no calendars, no shared calendar, and not loading */}
        {!isLoadingSharedInfo && !isAuthenticated && calendars.length === 0 && !sharedCalendarInfo?.calendar_id && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100/50 text-primary-500">
              <Icon icon="lucide:calendar" width={32} height={32} />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Connect Your Calendar</h3>
              <p className="text-small text-default-500 max-w-md">
                Sign in with Google to access your calendars and share them with Bard Labs 
                for session management and synchronization.
              </p>
            </div>

            <Button
              className="flex items-center justify-center gap-2"
              variant="bordered"
              onPress={openGoogleLogin}
            >
              <FcGoogle className="text-xl" />
              Sign in with Google to connect your calendar
            </Button>

            <div className="flex items-center gap-1 text-tiny text-default-400">
              <Icon icon="lucide:shield-check" className="text-success" />
              <span>Your data is secure and private</span>
              <Tooltip content="We only access calendar events. No personal data is stored.">
                <button className="flex h-4 w-4 items-center justify-center rounded-full bg-default-100 text-default-500">
                  <Icon icon="lucide:info" width={12} height={12} />
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Loading state - show when fetching calendars */}
        {(isAuthenticated && calendars.length === 0) || isLoadingCalendars ? (
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100/50 text-primary-500">
              <Icon icon="lucide:loader-2" width={32} height={32} className="animate-spin" />
            </div>
            <p className="text-small text-default-500">Loading your calendars...</p>
          </div>
        ) : null}

        {/* Calendar selection - show when calendars are loaded */}
        {calendars.length > 0 && (
          <>
            <Select
              label="Select a calendar to share"
              placeholder="Choose a calendar"
              selectedKeys={selectedCalendar}
              onSelectionChange={(selection) => {
                setSelectedCalendar(selection);
                // Auto-share when a calendar is selected
                const selectedId = Array.from(selection)[0] as string;
                if (selectedId) {
                  handleShareCalendar(selectedId);
                }
              }}
              variant="bordered"
              labelPlacement="outside"
              classNames={{
                trigger: "h-12",
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
                          backgroundColor: calendar.backgroundColor || "#3B82F6",
                        }}
                      />
                    </div>
                  }
                >
                  {calendar.summary}
                </SelectItem>
              ))}
            </Select>
            
            {/* Lightweight status display under selector */}
            {shareCalendarMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-primary-600">
                <Icon 
                  icon="lucide:loader-2" 
                  className="text-base animate-spin"
                />
                <span>Sharing calendar...</span>
              </div>
            )}
            {!shareCalendarMutation.isPending && status.type && (
              <div className={`flex items-center gap-2 text-sm ${
                status.type === "success" ? "text-success-600" : "text-danger-600"
              }`}>
                <Icon 
                  icon={status.type === "success" ? "lucide:check-circle" : "lucide:x-circle"} 
                  className="text-base"
                />
                <span>{status.message}</span>
              </div>
            )}

            <div className="bg-default-50 rounded-medium p-4">
              <div className="flex items-start gap-3">
                <Icon icon="lucide:info" className="text-primary mt-0.5" />
                <div className="text-small">
                  <p className="font-medium">Sharing permissions</p>
                  <p className="text-default-500 mt-1">
                    This will grant Bard Labs write access to your calendar, allowing 
                    session creation and synchronization. You can revoke access at any 
                    time from your Google account settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                className="flex items-center gap-2"
                onPress={() => {
                  // Clear global store and local state
                  clearGoogleAuth();
                  setCalendars([]);
                  setSelectedCalendar(new Set([]));
                }}
                variant="flat"
                size="sm"
              >
                <Icon icon="lucide:log-out" />
                Logout
              </Button>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

const OrganizationsPage = () => {
  return (
    <div className="flex flex-col w-full h-full items-center pt-[72px] md:pt-0">
      <OrganizationProfile>
        <OrganizationProfile.Page
          label="Calendar Settings"
          labelIcon={<Icon icon="mdi:calendar" />}
          url="calendar-settings"
        >
          <CalendarSettings />
        </OrganizationProfile.Page>
        <OrganizationProfile.Page
          label="Notification Settings"
          labelIcon={<Icon icon="mdi:bell-outline" />}
          url="notifications-settings"
        >
          <NotificationSettings />
        </OrganizationProfile.Page>
      </OrganizationProfile>
    </div>
  );
};

export default OrganizationsPage;
