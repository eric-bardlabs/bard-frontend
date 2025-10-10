const BACKEND_HOST = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

export interface NotificationSettings {
  email?: boolean;
  mobile?: boolean;
  sms?: boolean;
}

export interface UserNotificationSettings {
  user_id: string;
  name: string;
  image_url: string | null;
  identifier: string;
  notification_settings: NotificationSettings;
}

export interface NotificationSettingsResponse {
  user_notification_settings: UserNotificationSettings[];
}

export interface SearchSession {
  id: string;
  title: string;
}

export interface SearchTrack {
  id: string;
  display_name: string;
}

export interface GlobalSearchResponse {
  sessions: SearchSession[];
  tracks: SearchTrack[];
}

export async function fetchNotificationSettings({
  token,
}: {
  token: string;
}): Promise<NotificationSettingsResponse> {
  const response = await fetch(`${BACKEND_HOST}/organization/notification-settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function globalSearch({
  token,
  search,
}: {
  token: string;
  search: string;
}): Promise<GlobalSearchResponse> {
  const response = await fetch(
    `${BACKEND_HOST}/organization/global-search?search=${encodeURIComponent(search)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export interface UpdateNotificationSettingsRequest {
  user_id: string;
  notification_settings: NotificationSettings;
}

export interface UpdateNotificationSettingsResponse {
  success: boolean;
  message: string;
}

export async function updateNotificationSettings({
  token,
  user_id,
  notification_settings,
}: {
  token: string;
  user_id: string;
  notification_settings: NotificationSettings;
}): Promise<UpdateNotificationSettingsResponse> {
  const response = await fetch(`${BACKEND_HOST}/organization/notification-settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id,
      notification_settings,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}