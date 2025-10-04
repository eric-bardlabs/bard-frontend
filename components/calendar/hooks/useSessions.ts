import React from "react";
import { fetchSessions, syncCalendar, Session } from "@/lib/api/sessions";
import { useAuth } from "@clerk/nextjs";
// import { api } from "../services/api";

interface UseSessionsReturn {
  sessions: Session[];
  isLoading: boolean;
  error: Error | null;
  fetchSessionsByDateRange: (startDate: Date, endDate: Date) => Promise<void>;
}

export const useSessions = (): UseSessionsReturn => {
  const { getToken } = useAuth();
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Cache for date range queries to reduce API calls
  const dateRangeCache = React.useRef<{
    [key: string]: {
      sessions: Session[];
      timestamp: number;
    };
  }>({});

  // Cache expiration time (5 minutes)
  const CACHE_EXPIRATION = 5 * 60 * 1000;

  // Fetch events for a specific date range with caching
  const fetchSessionsByDateRange = async (
    startDate: Date,
    endDate: Date
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Create a cache key based on the date range
    const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check if we have a valid cached result
    const cachedResult = dateRangeCache.current[cacheKey];
    const now = Date.now();

    if (cachedResult && now - cachedResult.timestamp < CACHE_EXPIRATION) {
      setSessions(cachedResult.sessions);
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("Authentication failed");
      }

      // First, sync the calendar for this date range
      // This ensures we have the latest events from Google Calendar
      console.log(`Syncing calendar for ${startDate.toISOString()} to ${endDate.toISOString()}`);
      const syncResult = await syncCalendar({
        token,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      });

      if (syncResult.events_synced > 0) {
        console.log(`Synced ${syncResult.events_synced} events from Google Calendar`);
      }

      // Now fetch sessions for the date range
      const response = await fetchSessions({
        token,
        start_time_from: startDate.toISOString(),
        start_time_to: endDate.toISOString(),
        limit: 500, // Get all sessions in the range
      });

      // Update the sessions state with fresh data
      setSessions(response.sessions);

      // Cache the result
      dateRangeCache.current[cacheKey] = {
        sessions: response.sessions,
        timestamp: now,
      };

      // Clean up old cache entries
      Object.keys(dateRangeCache.current).forEach((key) => {
        if (now - dateRangeCache.current[key].timestamp > CACHE_EXPIRATION) {
          delete dateRangeCache.current[key];
        }
      });
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sessions,
    isLoading,
    error,
    fetchSessionsByDateRange,
  };
};
