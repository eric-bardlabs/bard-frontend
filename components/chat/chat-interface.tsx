import React, { useEffect, useRef, useState } from "react";
import { Card, Input, Button, Avatar, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ChatMessage } from "./chat-message";
import { debounce } from "lodash";
import { StopCircleIcon } from "lucide-react";
import { UserResponse } from "@/lib/api/user";

type Message = {
  id?: string;
  content: string;
  role: "assistant" | "tool" | "user";
  timestamp?: Date;
};

export const ChatInterface = (props: {
  thread: {
    openaiThreadId: string;
    status: string;
  };
  messages: Message[];
  sendMessage: (message: Message) => Promise<void>;
  getMessages: (messageId?: string) => Promise<void>;
  user: UserResponse | null;
}) => {
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isScrollToBottom, setIsScrollToBottom] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const handleScroll = debounce(async () => {
    const container = containerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    if (scrollTop === 0) {
      console.log("Load more messages");
      const firstMessage = props.messages[0];
      if (firstMessage) await props.getMessages(firstMessage.id!);
    }
    setIsScrollToBottom(false);
  }, 200);

  useEffect(() => {
    if (isScrollToBottom || !initialized) {
      if (props.messages.length > 0) {
        if (!initialized) {
          messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
          setInitialized(true);
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          setIsScrollToBottom(false);
        }
      }
    }
  }, [props.messages, isScrollToBottom]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      content: inputValue,
      role: "user",
    };

    setInputValue("");
    await props.sendMessage(userMessage);
    setIsScrollToBottom(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      props.thread.status === "completed"
    ) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full h-full">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-divider bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                name="M"
                className="bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                size="sm"
                icon={<Icon icon="lucide:sparkles" width={20} />}
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-md font-semibold">Melody</h2>
                <span className="text-xs bg-gradient-to-r from-purple-400 to-blue-400 text-white px-2 py-0.5 rounded-full">
                  AI Assistant
                </span>
              </div>
              <p className="text-sm text-default-600 mt-1">
                Hi {props.user?.first_name || 'there'}! 👋 I'm Melody, your AI music assistant. I can help you manage your songs, collaborations, and answer any questions about your music business.
              </p>
            </div>
          </div>
        </div>

        <div
          className="space-y-4 overflow-y-auto p-4 flex-1 pb-20"
          ref={containerRef}
          onScroll={handleScroll}
        >
          <div ref={messagesTopRef} className="" />
          {props.messages.map((message) => (
            <ChatMessage key={message.id} message={message} user={props.user} />
          ))}
          {props.thread.status === "in_progress" && (
            <div className="flex items-start gap-3 animate-fadeIn">
              <Avatar
                name="M"
                className="bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                size="sm"
                icon={<Icon icon="lucide:sparkles" width={20} />}
              />
              <div className="p-3 bg-content2 rounded-lg rounded-tl-none max-w-[80%]">
                <Spinner size="sm" color="primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-divider">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onValueChange={setInputValue}
              placeholder="Type your message..."
              onKeyDown={handleKeyPress}
              className="flex-grow"
            />
            <Button
              color="primary"
              isIconOnly
              onPress={handleSendMessage}
              isDisabled={
                !inputValue.trim() || props.thread.status === "in_progress"
              }
            >
              {props.thread.status === "in_progress" ? (
                <StopCircleIcon className="w-5 h-5" />
              ) : (
                <Icon icon="lucide:send" width={18} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
