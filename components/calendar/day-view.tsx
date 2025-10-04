import React from "react";
import { useSessionContext } from "./session-provider";
import { useDateFormatter } from "@react-aria/i18n";
import { getLocalTimeZone } from "@internationalized/date";
import { EventItem } from "./event-item";
import { TimeSlot } from "./time-slot";
import { Session } from "@/lib/api/sessions";

export const DayView: React.FC = () => {
  const { currentDate, sessions, openEditSessionModal, isLoading, error, refreshSessions } = useSessionContext();
  const dateFormatter = useDateFormatter({ dateStyle: "full" });
  
  const formattedDate = dateFormatter.format(currentDate.toDate(getLocalTimeZone()));
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const daySessions = sessions.filter((session: Session) => {
    const sessionDate = session.start_time ? new Date(session.start_time) : null;
    if (!sessionDate) return false;
    
    return (
      sessionDate.getFullYear() === currentDate.year &&
      sessionDate.getMonth() === currentDate.month - 1 &&
      sessionDate.getDate() === currentDate.day
    );
  });

  return (
    <div className="flex flex-col h-full relative">
      {/* <ErrorAlert error={error} onRetry={refreshEvents} /> */}
      
      <div className="text-xl font-semibold p-4 text-center border-b border-divider sticky top-0 bg-background z-20">
        {formattedDate}
      </div>
      
      <div className="flex-1">
        <div className="min-h-[1440px] relative"> {/* Ensure minimum height for scrolling (24h * 60px) */}
          {hours.map(hour => (
            <div key={hour} className="flex border-b border-divider h-16">
              <div className="w-16 text-xs text-default-500 p-1 text-right pr-2 border-r border-divider sticky left-0 bg-background z-20">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
              <div className="flex-1 relative">
                <TimeSlot 
                  hour={hour} 
                  date={currentDate.toDate(getLocalTimeZone())} 
                />
                
                {daySessions
                  .filter((session: Session) => {
                    const sessionHour = session.start_time ? new Date(session.start_time).getHours() : null;
                    return sessionHour !== null && sessionHour === hour;
                  })
                  .map((session: Session) => (
                    <div 
                      key={session.id} 
                      className="absolute left-0 ml-1 right-0 mr-4 z-10"
                      style={{
                        top: `${session.start_time ? new Date(session.start_time).getMinutes() / 60 * 100 : 0}%`,
                        height: `${session.start_time && session.end_time ? (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60 * 60) * 100 : 100}%`
                      }}
                    >
                      <EventItem session={session} onClick={() => openEditSessionModal(session)} />
                    </div>
                  ))}
              </div>
            </div>
          ))}
          
          {/* Current time indicator */}
          <CurrentTimeIndicator />
        </div>
      </div>
    </div>
  );
};

const CurrentTimeIndicator: React.FC = () => {
  const [now, setNow] = React.useState(new Date());
  
  React.useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const percentage = (hours * 60 + minutes) / (24 * 60) * 100;
  
  return (
    <div 
      className="absolute left-16 right-0 z-30 pointer-events-none"
      style={{ top: `${percentage}%` }}
    >
      <div className="relative flex items-center">
        <div className="absolute -left-2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500"></div>
        <div className="h-[2px] w-full bg-red-500"></div>
      </div>
    </div>
  );
};