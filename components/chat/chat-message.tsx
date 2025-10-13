import React from "react";
import { Avatar } from "@heroui/react";
import { Icon } from "@iconify/react";

type Message = {
  id?: string;
  content: string;
  role: "assistant" | "tool" | "user";
  timestamp?: Date;
};

interface ChatMessageProps {
  message: Message;
  user: any;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, user }) => {
  const isAssistant = message.role === "assistant";
  const formattedTime =
    `${message.timestamp!.getFullYear()}-${(message.timestamp!.getMonth() + 1).toString().padStart(2, "0")}-${message.timestamp!.getDate().toString().padStart(2, "0")} ` +
    `${message.timestamp!.getHours().toString().padStart(2, "0")}:${message.timestamp!.getMinutes().toString().padStart(2, "0")}:${message.timestamp!.getSeconds().toString().padStart(2, "0")}`;

  return (
    <div
      className={`flex items-start gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}
    >
      {isAssistant ? (
        <Avatar
          name="M"
          className="bg-gradient-to-br from-purple-500 to-blue-500 text-white"
          size="sm"
          icon={<Icon icon="lucide:sparkles" width={16} />}
        />
      ) : (
        <Avatar
          src={user?.profile_picture}
          name={user?.last_name || user?.first_name || "User"}
          size="sm"
        />
      )}
      <div className="space-y-1 max-w-[80%]">
        <div className="flex flex-col gap-1">
          {isAssistant && (
            <span className="text-xs font-medium text-purple-600">Melody</span>
          )}
          <div
            className={`p-3 rounded-lg ${
              isAssistant
                ? "bg-content2 rounded-tl-none"
                : "bg-primary text-white rounded-tr-none"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
        <p
          className={`text-tiny text-default-400 ${isAssistant ? "text-left" : "text-right"}`}
        >
          {formattedTime}
        </p>
      </div>
    </div>
  );
};
