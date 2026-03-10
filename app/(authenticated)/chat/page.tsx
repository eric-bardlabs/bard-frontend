"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { useUserContext } from "@/components/UserContext";
import { useAuth, useOrganization, useUser } from "@clerk/nextjs";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect, useMemo } from "react";

export default function Chat() {

  const [thread, setThread] = useState<
    | {
        openaiThreadId: string;
        status: string;
      }
    | undefined
  >(undefined);
  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { user: userData, isLoading: isLoadingUserData, refetch: refetchUserData } = useUserContext();

  const aiHost =
    process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL ||
    "http://localhost:8000";

  const [messages, setMessages] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Fetch initial thread info
  const { data: threadData, isLoading: isLoadingThread } = useQuery({
    queryKey: ["chat-thread", organization?.id, user?.id],
    queryFn: async () => {
      const token = await getToken({ template: "bard-backend" });
      if (!token) {
        throw new Error("No authentication token");
      }
      
      const response = await axios.get(`${aiHost}/chat/thread`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    },
    enabled: !!organization?.id && !!user?.id,
  });

  // Set thread from query data
  useEffect(() => {
    if (threadData && !thread) {
      setThread({
        openaiThreadId: threadData.openai_thread_id,
        status: threadData.status,
      });
    }
  }, [threadData, thread]);

  const getMessagesHandler = async (messageId?: string) => {
    const token = await getToken({ template: "bard-backend" });

    const url = messageId
      ? `${aiHost}/chat/threads/${thread?.openaiThreadId}/messages?after=${messageId}`
      : `${aiHost}/chat/threads/${thread?.openaiThreadId}/messages`;
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const messages = response.data.map((msg: any) => ({
      id: msg.message_id,
      content: msg.content?.trim(),
      role: msg.role,
      timestamp: new Date(msg.timestamp),
    }));
    messages.reverse();
    setMessages((prev) => [...messages, ...prev]);
  };

  useEffect(() => {
    if (thread && !initialized) {
      getMessagesHandler();
      setInitialized(true);
    }
  }, [thread, initialized]);

  const sendMessageHandler = async (message: {
    content: string;
    role: "assistant" | "tool" | "user";
  }) => {
    try {
      const token = await getToken({ template: "bard-backend" });
      const timestamp = new Date();
      const newMessage = {
        id: crypto.randomUUID(),
        content: message.content,
        role: message.role,
        timestamp: timestamp.toISOString(),
      };

      // Add user message immediately
      setMessages((prev) => [...prev, {
        ...newMessage,
        timestamp: timestamp, // Keep as Date object for display
      }]);

      // Set thread status to in_progress to show spinner
      setThread((prev) => prev ? { ...prev, status: "in_progress" } : prev);

      console.log("Posting message to backend:", newMessage);
      const response = await axios.post(
        `${aiHost}/chat/threads/${thread?.openaiThreadId}/messages`,
        newMessage,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response received:", response.data);
      
      // Add assistant message from response
      setMessages((prev) => [...prev, {
        id: response.data.assistant_message.id,
        content: response.data.assistant_message.content,
        role: response.data.assistant_message.role,
        timestamp: new Date(response.data.assistant_message.timestamp),
      }]);

      // Set thread status back to completed
      setThread((prev) => prev ? { ...prev, status: "completed" } : prev);

    } catch (error) {
      console.error("Error sending message:", error);
      // Reset thread status on error
      setThread((prev) => prev ? { ...prev, status: "completed" } : prev);
    }
  };


  if (!thread) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-[72px] md:pt-0">
      <ChatInterface
        thread={thread}
        messages={messages}
        sendMessage={sendMessageHandler}
        getMessages={getMessagesHandler}
        user={userData || null}
      />
    </div>
  );
}
