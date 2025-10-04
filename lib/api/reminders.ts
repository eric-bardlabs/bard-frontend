import axios from "axios";

const backendHost = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

export async function dismissReminder(reminderId: string, token: string) {
  const response = await fetch(`${backendHost}/reminders/song_tasks/${reminderId}/dismiss`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to dismiss reminder: ${response.statusText}`);
  }
  
  return response.json();
}

export async function dismissRemindersBulk(reminderIds: string[], token: string) {
  const response = await fetch(`${backendHost}/reminders/song_tasks/dismiss-bulk`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reminder_ids: reminderIds }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to dismiss reminders: ${response.statusText}`);
  }
  
  return response.json();
}

export async function refreshReminders(token: string) {
  const response = await fetch(`${backendHost}/reminders/song_tasks/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to refresh reminders: ${response.statusText}`);
  }
  
  return response.json();
}