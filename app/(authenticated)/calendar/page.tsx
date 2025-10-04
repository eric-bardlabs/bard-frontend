"use client";
import "react-big-calendar/lib/css/react-big-calendar.css";
import React from "react";

import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { SessionModal } from "@/components/calendar/session-modal";
import { SessionProvider } from "@/components/calendar/session-provider";

const Calender = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SessionProvider>
        {/* Header is now outside the scrollable area with higher z-index */}
        <div className="sticky top-0 z-30 bg-background shadow-sm">
          <CalendarHeader />
        </div>
        {/* Calendar view takes remaining height and scrolls independently */}
        <div className="flex-1 overflow-hidden">
          <CalendarView />
        </div>
        <SessionModal />
      </SessionProvider>
    </div>
  );
};

export default Calender;
