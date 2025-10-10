import React from "react";
import { Checkbox, CheckboxGroup, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { NotificationSettings, UserNotificationSettings, updateNotificationSettings } from "@/lib/api/organization";
import { addToast } from "@heroui/react";
import { useAuth } from "@clerk/nextjs";

interface UserNotificationPreferenceProps {
  user_notification_setting: UserNotificationSettings;
}

export const UserNotificationPreference: React.FC<
  UserNotificationPreferenceProps
> = ({ user_notification_setting }) => {
  const { getToken } = useAuth();
  const [preferences, setPreferences] = React.useState<NotificationSettings>(
    {
      email: user_notification_setting.notification_settings?.email ?? false,
      mobile: user_notification_setting.notification_settings?.mobile ?? false,
      sms: user_notification_setting.notification_settings?.sms ?? false,
    }
  );
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handlePreferenceChange = async (
    key: keyof NotificationSettings,
    checked: boolean
  ) => {
    setIsUpdating(true);

    const newPreferences = { ...preferences, [key]: checked };

    try {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("No auth token available");
      }

      await updateNotificationSettings({
        token,
        user_id: user_notification_setting.user_id,
        notification_settings: newPreferences,
      });

      setPreferences(newPreferences);

      addToast({
        title: "Preference Updated",
        description: `Notification preference for ${user_notification_setting.name} has been updated.`,
        color: "success",
        timeout: 3000,
      });
    } catch (error) {
      console.error("Failed to update notification preference:", error);

      addToast({
        title: "Update Failed",
        description:
          "Failed to update notification preference. Please try again.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-default-200 bg-content1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-default-100">
            <img
              src={user_notification_setting.image_url ?? ""}
              alt={user_notification_setting.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium">{user_notification_setting.name}</p>
            <p className="text-default-500 text-xs">{user_notification_setting.identifier}</p>
          </div>
        </div>

        {isUpdating ? (
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <span className="text-sm text-default-500">Updating...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            <Checkbox
              isSelected={preferences.email}
              onValueChange={(checked) =>
                handlePreferenceChange("email", checked)
              }
              color="primary"
            >
              <div className="flex items-center gap-1">
                <Icon icon="lucide:mail" className="text-default-500" />
                <span>Email</span>
              </div>
            </Checkbox>
            <Checkbox
              isSelected={preferences.mobile}
              onValueChange={(checked) =>
                handlePreferenceChange("mobile", checked)
              }
              color="primary"
            >
              <div className="flex items-center gap-1">
                <Icon icon="lucide:smartphone" className="text-default-500" />
                <span>Mobile</span>
              </div>
            </Checkbox>
            <Checkbox
              isSelected={preferences.sms}
              onValueChange={(checked) =>
                handlePreferenceChange("sms", checked)
              }
              color="primary"
            >
              <div className="flex items-center gap-1">
                <Icon icon="lucide:message-square" className="text-default-500" />
                <span>SMS</span>
              </div>
            </Checkbox>
          </div>
        )}
      </div>
      
      {preferences.sms && (
        <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
          <p className="text-xs text-warning-700">
            By checking the SMS box, you agree to receive text messages from Bardlabs related to customer assistance in using our product. Message and data rates may apply. You can change your settings at any time.
          </p>
        </div>
      )}
    </div>
  );
};
