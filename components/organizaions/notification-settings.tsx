import React from "react";
import { Divider, Spinner } from "@heroui/react";
import { UserNotificationPreference } from "./user-notification-preference";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { fetchNotificationSettings } from "@/lib/api/organization";

export const NotificationSettings: React.FC = () => {
  const { getToken } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["notificationSettings"],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) throw new Error("No auth token");
      
      return fetchNotificationSettings({ token });
    },
    enabled: !!getToken,
  });

  const user_notification_settings = data?.user_notification_settings || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-danger-500">Failed to load notification settings</p>
        <p className="text-xs text-danger-400 mt-1">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Post Session Notifications</h3>
          <p className="text-default-500 text-sm">
            Configure how you want to be notified about activities on Bardlabs. e.g. post session catalog updates, upcoming sessions, etc.
          </p>
        </div>
      </div>

      <Divider className="my-4" />

      <div className="space-y-4 py-2">
        {user_notification_settings.map((user_notification_setting) => (
          <UserNotificationPreference key={user_notification_setting.user_id} user_notification_setting={user_notification_setting} />
        ))}
      </div>
    </div>
  );
};
