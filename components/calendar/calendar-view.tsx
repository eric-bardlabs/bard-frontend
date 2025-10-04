import React from "react";
import { DayView } from "./day-view";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { useSessionContext } from "./session-provider";

export const CalendarView: React.FC = () => {
  const { viewMode } = useSessionContext();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to 8am when the view changes or component mounts
  React.useEffect(() => {
    if (scrollContainerRef.current && (viewMode === "day" || viewMode === "week")) {
      // Calculate scroll position for 8am (8 hours * 64px per hour)
      const scrollPosition = 8 * 64;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [viewMode]);

  return (
    <div ref={scrollContainerRef} className="h-full overflow-auto">
      {viewMode === "day" && <DayView />}
      {viewMode === "week" && <WeekView />}
      {viewMode === "month" && <MonthView />}
    </div>
  );
};