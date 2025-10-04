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