import React from "react";
import { useDateFormatter } from "@react-aria/i18n";
import { Tooltip, Avatar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Session } from "@/lib/api/sessions";

interface EventItemProps {
  session: Session;
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const EventItem: React.FC<EventItemProps> = ({ session, compact = false, onClick }) => {
  const timeFormatter = useDateFormatter({ timeStyle: "short" });
  
  const startTime = session.start_time ? timeFormatter.format(new Date(session.start_time)) : "";
  const endTime = session.end_time ? timeFormatter.format(new Date(session.end_time)) : "";
  
  const bgColor = "bg-primary-500";
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to time slot
    if (onClick) onClick(e);
  };
  
  const hasSongs = session.tracks && session.tracks.length > 0;
  const hasCollaborators = session.collaborators && session.collaborators.length > 0;
  
  if (compact) {
    return (
      <div 
        className={`${bgColor} text-white text-xs p-1 rounded cursor-pointer truncate`}
        onClick={handleClick}
      >
        {startTime} - {session.title}
        {(hasSongs || hasCollaborators) && (
          <span className="ml-1">
            {hasSongs && <Icon icon="lucide:music" className="inline-block ml-1" width={12} />}
            {hasCollaborators && <Icon icon="lucide:users" className="inline-block ml-1" width={12} />}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div 
      className={`${bgColor} text-white p-1 rounded cursor-pointer h-full overflow-hidden`}
      onClick={handleClick}
    >
      <div className="font-medium">{session.title}</div>
      <div className="text-xs">{startTime} - {endTime}</div>
      {session.description && !compact && (
        <div className="text-xs mt-1 truncate">{session.description}</div>
      )}
      
      {/* Show icons for songs and collaborators */}
      {(hasSongs || hasCollaborators) && (
        <div className="flex items-center gap-1 mt-1">
          {hasSongs && (
            <Tooltip content={`${session.tracks!.length} song${session.tracks!.length > 1 ? 's' : ''}`}>
              <div className="flex items-center">
                <Icon icon="lucide:music" width={14} />
                <span className="text-xs ml-1">{session.tracks!.length}</span>
              </div>
            </Tooltip>
          )}
          
          {hasCollaborators && (
            <Tooltip content={`${session.collaborators!.length} collaborator${session.collaborators!.length > 1 ? 's' : ''}`}>
              <div className="flex items-center ml-2">
                <Icon icon="lucide:users" width={14} />
                <span className="text-xs ml-1">{session.collaborators!.length}</span>
              </div>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};