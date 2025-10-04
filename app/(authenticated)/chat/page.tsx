"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { useAuth, useOrganization, useUser } from "@clerk/nextjs";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

export default function Chat() {

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [thread, setThread] = useState<
    | {
        openaiThreadId: string;
        status: string;
      }
    | undefined
  >(undefined);
  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const {user} = useUser();
  
  const aiHost =
    process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL ||
    "http://localhost:8000";

  // Properly construct WebSocket URL
  const socketHost = useMemo(() => {
    if (aiHost.startsWith("https://")) {
      return aiHost.replace("https://", "wss://");
    } else if (aiHost.startsWith("http://")) {
      return aiHost.replace("http://", "ws://");
    }
    return `ws://${aiHost}`;
  }, [aiHost]);

  const socket = useMemo(() => {
    if (!organization?.id || !user?.id) {
      return null;
    }

    const newSocket = io(socketHost, {
      auth: {
        organizationId: organization.id,
        userId: user.id,
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });

    return newSocket;
  }, [socketHost, organization?.id, user?.id]);

  const { data: userInfo, isLoading } = useQuery({
    queryFn: () => axios.get("/api/user").then((result) => result.data),
    queryKey: ["user"],
  });

  const [messages, setMessages] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

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
      setMessages((prev) => [...prev, {
        ...newMessage,
        timestamp: timestamp, // Keep as Date object for display
      }]);

      await axios.post(
        `${aiHost}/chat/threads/${thread?.openaiThreadId}/messages`,
        newMessage,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    if (!socket) {
      return;
    }

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    function onConnect() {
      setIsConnected(true);
      setConnectionError(null);
    }

    function onDisconnect(reason: string) {
      setIsConnected(false);

      if (reason === "io server disconnect" && socket) {
        // Server disconnected us, try to reconnect
        socket.connect();
      }
    }

    function onConnectError(error: Error) {
      console.error("Socket connection error:", error);
      setConnectionError(`Connection failed: ${error.message}`);
      setIsConnected(false);
    }

    function onThreadUpdated(data: any) {
      setThread({
        openaiThreadId: data.openai_thread_id,
        status: data.status,
      });
    }

    function onUserMessageUpdated(data: any) {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === data.message.id)) {
          return prev;
        } else {
          return [
            ...prev,
            {
              id: data.message.message_id,
              content: data.message.content?.trim(),
              role: data.message.role,
              timestamp: new Date(data.message.timestamp),
            },
          ];
        }
      });
    }

    function onAssistantMessageUpdated(data: any) {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === data.message.id)) {
          return prev;
        } else {
          return [
            ...prev,
            {
              id: data.message.message_id,
              content: data.message.content?.trim(),
              role: data.message.role,
              timestamp: new Date(data.message.timestamp),
            },
          ];
        }
      });
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("thread_updated", onThreadUpdated);
    socket.on("user_message_updated", onUserMessageUpdated);
    socket.on("assistant_message_updated", onAssistantMessageUpdated);

    return () => {
      if (socket) {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
        socket.off("thread_updated", onThreadUpdated);
        socket.off("user_message_updated", onUserMessageUpdated);
        socket.off("assistant_message_updated", onAssistantMessageUpdated);
        socket.close();
      }
    };
  }, [socket, socketHost]);

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-[72px] md:pt-0">
      {connectionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Connection Error:</strong> {connectionError}
        </div>
      )}
      <ChatInterface
        thread={thread}
        messages={messages}
        sendMessage={sendMessageHandler}
        getMessages={getMessagesHandler}
        user={userInfo}
      />
    </div>
  );
}
