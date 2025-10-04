import React from "react";
import { useSessionContext } from "./session-provider";

interface TimeSlotProps {
  hour: number;
  date: Date;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({ hour, date }) => {
  const { openNewSessionModalWithTime } = useSessionContext();
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState<number | null>(null);
  const [dragEnd, setDragEnd] = React.useState<number | null>(null);
  const slotRef = React.useRef<HTMLDivElement>(null);
  
  const getMinuteFromY = (y: number): number => {
    if (!slotRef.current) return 0;
    const rect = slotRef.current.getBoundingClientRect();
    const relativeY = y - rect.top;
    const percentage = relativeY / rect.height;
    return Math.min(Math.max(Math.floor(percentage * 60), 0), 59);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection during drag
    const minute = getMinuteFromY(e.clientY);
    setIsDragging(true);
    setDragStart(minute);
    setDragEnd(minute);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault(); // Prevent text selection during drag
      const minute = getMinuteFromY(e.clientY);
      setDragEnd(minute);
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection during drag
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const startMinute = Math.min(dragStart, dragEnd);
      const endMinute = Math.max(dragStart, dragEnd);
      
      const startDate = new Date(date);
      startDate.setHours(hour, startMinute, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(hour, endMinute, 0, 0);
      
      // If the drag is too short (less than 5 minutes), create a default 30-minute event
      if (endDate.getTime() - startDate.getTime() < 5 * 60 * 1000) {
        endDate.setMinutes(startDate.getMinutes() + 30);
      }
      
      openNewSessionModalWithTime(startDate, endDate);
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };
  
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }
  };
  
  // Calculate the selection area
  const selectionStyle = React.useMemo(() => {
    if (!isDragging || dragStart === null || dragEnd === null) {
      return { display: 'none' };
    }
    
    const top = Math.min(dragStart, dragEnd) / 60 * 100;
    const height = Math.abs(dragEnd - dragStart) / 60 * 100;
    
    return {
      top: `${top}%`,
      height: `${height}%`,
      display: 'block'
    };
  }, [isDragging, dragStart, dragEnd]);
  
  return (
    <div 
      ref={slotRef}
      className="absolute inset-0 cursor-pointer select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ touchAction: 'none' }} // Prevent scrolling on touch devices during drag
    >
      <div 
        className="absolute left-0 right-0 bg-primary-200 opacity-50 pointer-events-none z-5"
        style={selectionStyle}
      />
    </div>
  );
};