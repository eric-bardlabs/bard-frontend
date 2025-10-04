"use client";

import React from "react";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import { useSessions } from "./hooks/useSessions";
import { addToast } from "@heroui/react";
import { getDateRangeForView } from "./utils/date-utils";
import { Session } from "@/lib/api/sessions";

interface SessionContextType {
  sessions: Session[];
  isLoading: boolean;
  error: Error | null;
  currentDate: CalendarDate;
  setCurrentDate: (date: CalendarDate) => void;
  viewMode: "day" | "week" | "month";
  setViewMode: (mode: "day" | "week" | "month") => void;
  isModalOpen: boolean;
  openNewSessionModal: () => void;
  openNewSessionModalWithDate: (date: Date) => void;
  openNewSessionModalWithTime: (start: Date, end: Date) => void;
  openEditSessionModal: (session: Session) => void;
  closeModal: () => void;
  currentSession: Session | null;
  initialStartDate: Date | null;
  initialEndDate: Date | null;
  refreshSessions: () => void;
  currentDateRange: { start: Date; end: Date };
}

const SessionContext = React.createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = React.useState<CalendarDate>(today(getLocalTimeZone()));
  const [viewMode, setViewMode] = React.useState<"day" | "week" | "month">("week");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [currentSession, setCurrentSession] = React.useState<Session | null>(null);
  const [initialStartDate, setInitialStartDate] = React.useState<Date | null>(null);
  const [initialEndDate, setInitialEndDate] = React.useState<Date | null>(null);
  
  // Calculate the date range based on current date and view mode
  const currentDateRange = React.useMemo(() => {
    return getDateRangeForView(currentDate.toDate(getLocalTimeZone()), viewMode);
  }, [currentDate, viewMode]);
  
  const { 
    sessions, 
    isLoading, 
    error, 
    fetchSessionsByDateRange, 
  } = useSessions();
  
  // Fetch sessions when date range changes
  React.useEffect(() => {
    fetchSessionsByDateRange(currentDateRange.start, currentDateRange.end);
  }, [currentDateRange]);
  
  // Show toast when there's an error
  React.useEffect(() => {
    if (error) {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger"
      });
    }
  }, [error]);

  
  const openNewSessionModal = () => {
    setCurrentSession(null);
    setInitialStartDate(null);
    setInitialEndDate(null);
    setIsModalOpen(true);
  };
  
  const openNewSessionModalWithDate = (date: Date) => {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(10, 0, 0, 0);
    
    setCurrentSession(null);
    setInitialStartDate(start);
    setInitialEndDate(end);
    setIsModalOpen(true);
  };
  
  const openNewSessionModalWithTime = (start: Date, end: Date) => {
    setCurrentSession(null);
    setInitialStartDate(start);
    setInitialEndDate(end);
    setIsModalOpen(true);
  };
  
  const openEditSessionModal = (session: Session) => {
    setCurrentSession(session);
    setInitialStartDate(null);
    setInitialEndDate(null);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSession(null);
    setInitialStartDate(null);
    setInitialEndDate(null);
  };
  
  const refreshSessions = () => {
    fetchSessionsByDateRange(currentDateRange.start, currentDateRange.end);
  };

  const value = {
    sessions,
    isLoading,
    error,
    currentDate,
    setCurrentDate,
    viewMode,
    setViewMode,
    isModalOpen,
    openNewSessionModal,
    openNewSessionModalWithDate,
    openNewSessionModalWithTime,
    openEditSessionModal,
    closeModal,
    currentSession,
    initialStartDate,
    initialEndDate,
    refreshSessions,
    currentDateRange
  };
  
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = React.useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSessionContext must be used within an SessionProvider");
  }
  return context;
};