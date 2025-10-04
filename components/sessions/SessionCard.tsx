"use client";
import React from "react";
import {
  Card,
  CardBody,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
} from "@heroui/react";
import { 
  Calendar, 
  MapPin, 
  Music,
  Clock,
  ChevronRight,
  Users
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface SessionCardProps {
  session: any;
  onClick: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onClick }) => {
  // Backend now returns times with 'Z' suffix like "2025-09-26T21:00:00Z"
  // dayjs will automatically handle UTC to local timezone conversion
  const startTime = session.start_time ? dayjs(session.start_time) : null;
  const endTime = session.end_time ? dayjs(session.end_time) : null;
  const isUpcoming = startTime && startTime.isAfter(dayjs());
  const isUpcomingWithinWeek = startTime && startTime.isAfter(dayjs()) && startTime.isBefore(dayjs().add(7, 'days'));
  
  return (
    <Card 
      isPressable 
      onPress={onClick}
      className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-100"
    >
      <CardBody className="p-5">
        <div className="flex justify-between items-start gap-4">
          {/* Left section - Main info */}
          <div className="flex-1 space-y-3">
            {/* Title and badges */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {session.title || "Untitled Session"}
                  </h3>
                  {isUpcomingWithinWeek && (
                    <Chip 
                      size="sm" 
                      color="success" 
                      variant="flat"
                      className="bg-emerald-50 text-emerald-600"
                    >
                      Upcoming
                    </Chip>
                  )}
                </div>
                
                {session.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {session.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Date, Time, Location Info */}
            <div className="flex flex-wrap gap-4">
              {startTime && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 font-medium">
                    {startTime.format("MMM D, YYYY")}
                  </span>
                </div>
              )}
              
              {startTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {startTime.format("h:mm A")}
                    {endTime && ` - ${endTime.format("h:mm A")}`}
                  </span>
                </div>
              )}
              
              {session.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{session.location}</span>
                </div>
              )}
            </div>

            {/* Bottom section with counts and collaborators */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4">
                {/* Collaborators avatars */}
                {session.collaborators && session.collaborators.length > 0 && (
                  <div className="flex items-center gap-2">
                    <AvatarGroup 
                      max={4} 
                      size="sm"
                      className="gap-1"
                    >
                      {session.collaborators.slice(0, 4).map((collab: any) => (
                        <Tooltip 
                          key={collab.id} 
                          content={collab.artist_name || collab.legal_name || "Unknown"}
                        >
                          <Avatar 
                            name={collab.artist_name || collab.legal_name}
                            size="sm"
                            className="w-8 h-8 text-xs"
                          />
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                    {session.collaborators.length > 4 && (
                      <span className="text-xs text-gray-500">
                        +{session.collaborators.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3">
                  {session.tracks && session.tracks.length > 0 && (
                    <Tooltip
                      content={
                        <div className="max-w-xs">
                          <p className="font-semibold mb-1">Tracks:</p>
                          <ul className="text-xs space-y-0.5">
                            {session.tracks.map((track: any) => (
                              <li key={track.id}>• {track.display_name || "Untitled"}</li>
                            ))}
                          </ul>
                        </div>
                      }
                    >
                      <div className="flex items-center gap-1">
                        <Music className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 border-b border-dotted border-gray-300">
                          {session.tracks.length} track{session.tracks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </Tooltip>
                  )}
                  
                  {session.collaborators && session.collaborators.length > 0 && (
                    <Tooltip
                      content={
                        <div className="max-w-xs">
                          <p className="font-semibold mb-1">Collaborators:</p>
                          <ul className="text-xs space-y-0.5">
                            {session.collaborators.map((collab: any) => (
                              <li key={collab.id}>
                                • {collab.artist_name || collab.legal_name || "Unknown"}
                                {collab.email && <span className="text-gray-400 ml-1">({collab.email})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      }
                    >
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 border-b border-dotted border-gray-300">
                          {session.collaborators.length} collaborator{session.collaborators.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Relative time */}
              <div className="flex items-center gap-2">
                {startTime && (
                  <span className="text-xs text-gray-400">
                    {isUpcoming ? `in ${startTime.fromNow(true)}` : startTime.fromNow()}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};