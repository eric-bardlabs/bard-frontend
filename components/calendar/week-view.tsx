import React from "react";
import { useSessionContext } from "./session-provider";
import { useDateFormatter } from "@react-aria/i18n";
import { getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { EventItem } from "./event-item";
import { TimeSlot } from "./time-slot";
import { Session } from "@/lib/api/sessions";

export const WeekView: React.FC = () => {
  const { currentDate, sessions, openEditSessionModal } = useSessionContext();
  const dateFormatter = useDateFormatter({ dateStyle: "short" });
  const weekdayFormatter = useDateFormatter({ weekday: "short" });
  
  // Generate days of the week
  const weekDays = React.useMemo(() => {
    const days: CalendarDate[] = [];
    const firstDayOfWeek = currentDate.subtract({ days: currentDate.toDate(getLocalTimeZone()).getDay() });
    
    for (let i = 0; i < 7; i++) {
      const day = firstDayOfWeek.add({ days: i });
      days.push(day);
    }
    return days;
  }, [currentDate]);
  
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-divider sticky top-0 bg-background z-20">
        <div className="w-16 border-r border-divider"></div>
        {weekDays.map((day, index) => {
          const date = day.toDate(getLocalTimeZone());
          const isToday = 
            date.getDate() === new Date().getDate() && 
            date.getMonth() === new Date().getMonth() && 
            date.getFullYear() === new Date().getFullYear();
          
          return (
            <div 
              key={index} 
              className={`flex-1 p-2 text-center ${isToday ? 'bg-primary-100 dark:bg-primary-800' : ''}`}
            >
              <div className="text-sm font-medium">
                {weekdayFormatter.format(date)}
              </div>
              <div className={`text-lg ${isToday ? 'text-primary font-bold' : ''}`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex-1">
        <div className="min-h-[1440px]"> {/* Ensure minimum height for scrolling (24h * 60px) */}
          {hours.map(hour => (
            <div key={hour} className="flex border-b border-divider h-16">
              <div className="w-16 text-xs text-default-500 p-1 text-right pr-2 border-r border-divider sticky left-0 bg-background z-20">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
              
              {weekDays.map((day, dayIndex) => {
                const dayDate = day.toDate(getLocalTimeZone());
                const daySessions = sessions.filter((session: Session) => {
                  const sessionDate = session.start_time ? new Date(session.start_time) : null;
                  if (!sessionDate) return false;
                  
                  return (
                    sessionDate.getFullYear() === dayDate.getFullYear() &&
                    sessionDate.getMonth() === dayDate.getMonth() &&
                    sessionDate.getDate() === dayDate.getDate() &&
                    sessionDate.getHours() === hour
                  );
                });
                
                return (
                  <div key={dayIndex} className="flex-1 relative border-r border-divider">
                    <TimeSlot 
                      hour={hour} 
                      date={dayDate} 
                    />
                    
                    {daySessions.map((session: Session) => {
                      const startTime = session.start_time ? new Date(session.start_time) : null;
                      const endTime = session.end_time ? new Date(session.end_time) : null;

                      const isValidTime = startTime && endTime && !isNaN(startTime.getTime()) && !isNaN(endTime.getTime());

                      return (
                        <div 
                          key={session.id} 
                          className="absolute left-0 ml-1 right-0 mr-1 z-10"
                          style={{
                            top: isValidTime ? `${startTime.getMinutes() / 60 * 100}%` : '0%',
                            height: isValidTime ? `${(endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 100}%` : '100%'
                          }}
                        >
                          <EventItem session={session} onClick={() => openEditSessionModal(session)} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};