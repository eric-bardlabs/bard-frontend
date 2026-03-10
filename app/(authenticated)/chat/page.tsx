"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { useUserContext } from "@/components/UserContext";
import { useAuth, useOrganization, useUser } from "@clerk/nextjs";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect, useMemo, useCallback } from "react";
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
  const { user } = useUser();
  const { user: userData, isLoading: isLoadingUserData, refetch: refetchUserData } = useUserContext();

  const aiHost =
    process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL ||
    "http://localhost:8000";

  // Properly construct WebSocket URL
  const socketHost = useMemo(() => {
    let host;
    if (aiHost.startsWith("https://")) {
      host = aiHost.replace("https://", "wss://");
    } else if (aiHost.startsWith("http://")) {
      host = aiHost.replace("http://", "ws://");
    } else {
      host = `ws://${aiHost}`;
    }
    console.log("Socket host:", host, "from aiHost:", aiHost);
    return host;
  }, [aiHost]);

  const socket = useMemo(() => {
    if (!organization?.id || !user?.id) {
      console.log("Socket not created - missing org or user:", { orgId: organization?.id, userId: user?.id });
      return null;
    }

    console.log("Creating socket with:", { socketHost, orgId: organization.id, userId: user.id });
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
      console.log("Sending message, socket connected:", socket?.connected, "socket ID:", socket?.id, "thread:", thread?.openaiThreadId);
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

      console.log("Posting message to backend:", newMessage);
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
      console.log("Message posted successfully to backend");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Stable event handlers using useCallback
  const onConnect = useCallback(() => {
    console.log("Socket connected successfully! Socket ID:", socket?.id);
    setIsConnected(true);
    setConnectionError(null);
  }, [socket?.id]);

  const onDisconnect = useCallback((reason: string) => {
    console.log("Socket disconnected:", reason);
    setIsConnected(false);

    if (reason === "io server disconnect" && socket) {
      console.log("Attempting to reconnect...");
      socket.connect();
    }
  }, [socket]);

  const onConnectError = useCallback((error: Error) => {
    console.error("Socket connection error:", error);
    setConnectionError(`Connection failed: ${error.message}`);
    setIsConnected(false);
  }, []);

  const onThreadUpdated = useCallback((data: any) => {
    console.log("Thread updated event received:", data);
    setThread({
      openaiThreadId: data.openai_thread_id,
      status: data.status,
    });
  }, []);

  const onUserMessageUpdated = useCallback((data: any) => {
    console.log("User message event received:", data);
    setMessages((prev) => {
      if (prev.some((msg) => msg.id === data.message.id)) {
        console.log("User message already exists, skipping");
        return prev;
      } else {
        console.log("Adding new user message");
        return [
          ...prev,
          {
            id: data.message.id,
            content: data.message.content?.trim(),
            role: data.message.role,
            timestamp: new Date(data.message.timestamp),
          },
        ];
      }
    });
  }, []);

  const onAssistantMessageUpdated = useCallback((data: any) => {
    console.log("Assistant message event received:", data);
    setMessages((prev) => {
      if (prev.some((msg) => msg.id === data.message.id)) {
        console.log("Assistant message already exists, skipping");
        return prev;
      } else {
        console.log("Adding new assistant message");
        return [
          ...prev,
          {
            id: data.message.id,
            content: data.message.content?.trim(),
            role: data.message.role,
            timestamp: new Date(data.message.timestamp),
          },
        ];
      }
    });
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    // Register event handlers BEFORE connecting
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("thread_updated", onThreadUpdated);
    socket.on("user_message_updated", onUserMessageUpdated);
    socket.on("assistant_message_updated", onAssistantMessageUpdated);

    // Connect AFTER handlers are registered
    if (socket.connected) {
      onConnect();
    } else {
      console.log("Connecting socket with handlers already registered...");
      socket.connect();
    }

    return () => {
      if (socket) {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
        socket.off("thread_updated", onThreadUpdated);
        socket.off("user_message_updated", onUserMessageUpdated);
        socket.off("assistant_message_updated", onAssistantMessageUpdated);
        // Don't close socket here, just remove handlers
      }
    };
  }, [socket, onConnect, onDisconnect, onConnectError, onThreadUpdated, onUserMessageUpdated, onAssistantMessageUpdated]);

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
        user={userData || null}
      />
    </div>
  );
}
