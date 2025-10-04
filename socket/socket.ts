"use client";

import { io } from "socket.io-client";

console.log("Connecting to socket...", process.env.SOCKET_PATH);

export const socket = io({
  path: process.env.NEXT_PUBLIC_SOCKET_PATH || "ws://localhost:8000",
});
