/**
 * Gets the start and end dates for the given view mode
 * @param date The reference date
 * @param viewMode The current view mode (day, week, month)
 * @returns An object with start and end dates
 */
export function getDateRangeForView(date: Date, viewMode: "day" | "week" | "month"): { start: Date; end: Date } {
    const start = new Date(date);
    const end = new Date(date);
    
    switch (viewMode) {
      case "day":
        // For day view, start at beginning of day and end at end of day
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
        
      case "week":
        // For week view, start at beginning of week (Sunday) and end at end of week (Saturday)
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        start.setDate(date.getDate() - dayOfWeek); // Go to beginning of week (Sunday)
        start.setHours(0, 0, 0, 0);
        
        end.setDate(date.getDate() + (6 - dayOfWeek)); // Go to end of week (Saturday)
        end.setHours(23, 59, 59, 999);
        break;
        
      case "month":
        // For month view, start at beginning of month and end at end of month
        start.setDate(1); // First day of month
        start.setHours(0, 0, 0, 0);
        
        end.setMonth(date.getMonth() + 1, 0); // Last day of month
        end.setHours(23, 59, 59, 999);
        break;
    }
    
    // Add buffer days for better UX (show events slightly outside the range)
    if (viewMode === "week" || viewMode === "month") {
      // Add 1 week buffer on each side for month view
      if (viewMode === "month") {
        start.setDate(start.getDate() - 7);
        end.setDate(end.getDate() + 7);
      } 
      // Add 1 day buffer on each side for week view
      else {
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() + 1);
      }
    }
    
    return { start, end };
  }
  
  /**
   * Formats a date range as a string
   * @param start The start date
   * @param end The end date
   * @returns A formatted string representation of the date range
   */
  export function formatDateRange(start: Date, end: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    
    // If dates are in the same month and year
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${formatter.format(start)} - ${end.getDate()}`;
    }
    
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }