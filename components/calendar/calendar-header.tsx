import React from "react";
import { Button, DatePicker, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { useSessionContext } from "./session-provider";
import { formatDateRange } from "./utils/date-utils";

export const CalendarHeader: React.FC = () => {
  const { 
    currentDate, 
    setCurrentDate, 
    viewMode, 
    setViewMode,
    openNewSessionModal,
    isLoading,
    refreshSessions,
    currentDateRange
  } = useSessionContext();

  const handleDateChange = (date: any) => {
    setCurrentDate(date);
  };

  const handleToday = () => {
    setCurrentDate(today(getLocalTimeZone()));
  };

  const handlePrevious = () => {
    let newDate;
    if (viewMode === "month") {
      newDate = currentDate.subtract({ months: 1 });
    } else if (viewMode === "week") {
      newDate = currentDate.subtract({ weeks: 1 });
    } else {
      newDate = currentDate.subtract({ days: 1 });
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    let newDate;
    if (viewMode === "month") {
      newDate = currentDate.add({ months: 1 });
    } else if (viewMode === "week") {
      newDate = currentDate.add({ weeks: 1 });
    } else {
      newDate = currentDate.add({ days: 1 });
    }
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView: "day" | "week" | "month") => {
    setViewMode(newView);
  };

  // Format the current date range for display
  const formattedDateRange = formatDateRange(currentDateRange.start, currentDateRange.end);

  return (
    <header className="flex items-center justify-between p-4 border-b border-divider">
      <div className="flex items-center gap-4">
        <Button color="primary" onPress={openNewSessionModal}>
          <Icon icon="lucide:plus" className="mr-1" />
          Create
        </Button>
        
        <Button variant="light" onPress={handleToday}>
          Today
        </Button>
        
        <div className="flex items-center">
          <Button isIconOnly variant="light" onPress={handlePrevious}>
            <Icon icon="lucide:chevron-left" />
          </Button>
          <Button isIconOnly variant="light" onPress={handleNext}>
            <Icon icon="lucide:chevron-right" />
          </Button>
        </div>
        
        <div className="flex flex-col">
          <DatePicker
            value={currentDate}
            onChange={handleDateChange}
            className="max-w-[200px]"
          />
          <span className="text-xs text-default-500 mt-1">
            Viewing: {formattedDateRange}
          </span>
        </div>
        
        <Button 
          isIconOnly 
          variant="light" 
          onPress={refreshSessions}
          isLoading={isLoading}
        >
          <Icon icon="lucide:refresh-cw" />
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-default-500">
            <Spinner size="sm" />
            <span>Loading events...</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 border rounded-lg p-1 bg-content1">
          <Button 
            size="sm"
            variant={viewMode === "day" ? "solid" : "light"}
            className={viewMode === "day" ? "z-10" : ""}
            onPress={() => handleViewChange("day")}
          >
            Day
          </Button>
          <Button 
            size="sm"
            variant={viewMode === "week" ? "solid" : "light"}
            className={viewMode === "week" ? "z-10" : ""}
            onPress={() => handleViewChange("week")}
          >
            Week
          </Button>
          <Button 
            size="sm"
            variant={viewMode === "month" ? "solid" : "light"}
            className={viewMode === "month" ? "z-10" : ""}
            onPress={() => handleViewChange("month")}
          >
            Month
          </Button>
        </div>
      </div>
    </header>
  );
};