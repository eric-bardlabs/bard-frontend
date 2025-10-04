import React from "react";
import { useSessionContext } from "./session-provider";
import { useDateFormatter } from "@react-aria/i18n";
import { getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { EventItem } from "./event-item";
import { Session } from "@/lib/api/sessions";

export const MonthView: React.FC = () => {
  const { currentDate, sessions, openEditSessionModal, openNewSessionModalWithDate } = useSessionContext();
  const weekdayFormatter = useDateFormatter({ weekday: "short" });
  
  // Generate days for the month view
  const monthDays = React.useMemo(() => {
    const days:  CalendarDate[][] = [];
    const firstDayOfMonth = currentDate.set({ day: 1 });
    const firstDayOfWeek = firstDayOfMonth.subtract({ 
      days: firstDayOfMonth.toDate(getLocalTimeZone()).getDay() 
    });
    
    // 6 weeks to ensure we cover the whole month
    for (let week = 0; week < 6; week++) {
      const weekDays: CalendarDate[] = [];
      for (let day = 0; day < 7; day++) {
        const currentDay = firstDayOfWeek.add({ days: week * 7 + day });
        weekDays.push(currentDay);
      }
      days.push(weekDays);
    }
    
    return days;
  }, [currentDate]);
  
  const today = new Date();

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-divider sticky top-0 bg-background z-20">
        {[0, 1, 2, 3, 4, 5, 6].map(day => {
          const date = new Date();
          date.setDate(date.getDate() - date.getDay() + day);
          return (
            <div key={day} className="p-2 text-center font-medium">
              {weekdayFormatter.format(date)}
            </div>
          );
        })}
      </div>
      
      <div className="flex-1">
        <div className="grid grid-rows-6">
          {monthDays.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-divider">
              {week.map((day, dayIndex) => {
                const dayDate = day.toDate(getLocalTimeZone());
                const isCurrentMonth = dayDate.getMonth() === currentDate.month - 1;
                const isToday = 
                  dayDate.getDate() === today.getDate() && 
                  dayDate.getMonth() === today.getMonth() && 
                  dayDate.getFullYear() === today.getFullYear();
                
                const daySessions = sessions.filter((session: Session) => {
                  const sessionDate = session.start_time ? new Date(session.start_time) : null;
                  if (!sessionDate) return false;
                  
                  return (
                    sessionDate.getFullYear() === dayDate.getFullYear() &&
                    sessionDate.getMonth() === dayDate.getMonth() &&
                    sessionDate.getDate() === dayDate.getDate()
                  );
                });
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`min-h-[100px] border-r border-divider p-1 ${
                      isCurrentMonth ? '' : 'bg-content2/50 text-default-400'
                    } ${isToday ? 'bg-primary-100 dark:bg-primary-800' : ''}`}
                    onClick={() => isCurrentMonth && openNewSessionModalWithDate(dayDate)}
                  >
                    <div className={`text-right mb-1 ${isToday ? 'text-primary font-bold' : ''}`}>
                      {dayDate.getDate()}
                    </div>
                    
                    <div className="flex flex-col gap-1 overflow-hidden max-h-[80px]">
                      {daySessions.slice(0, 3).map((session: Session) => (
                        <EventItem 
                          key={session.id} 
                          session={session} 
                          compact 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditSessionModal(session);
                          }} 
                        />
                      ))}
                      
                      {daySessions.length > 3 && (
                        <div className="text-xs text-default-500 pl-1">
                          +{daySessions.length - 3} more
                        </div>
                      )}
                    </div>
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