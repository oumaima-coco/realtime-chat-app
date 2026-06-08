// useSocket — a React hook that connects to the backend Socket.io server
// when the component mounts and disconnects when it unmounts.
//
// Usage:
//   const { socket, isConnected } = useSocket();
//   useEffect(() => {
//     socket?.on("message:new", handleMessage);
//     return () => socket?.off("message:new", handleMessage);
//   }, [socket]);

import { useEffect, useState } from "react";
import { connectSocket, disconnectSocket, type ChatSocket } from "../api/socket";
import { STORAGE_KEYS } from "../api/axios";

export function useSocket() {
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Pull the JWT from localStorage. We assume the component using this
    // hook is wrapped in ProtectedRoute, so a token should exist.
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      // No token = can't authenticate. The ProtectedRoute should have
      // already redirected; this is a safety net.
      return;
    }

    const s = connectSocket(token);
    setSocket(s);

    // Set up connection lifecycle listeners. These let our component
    // know when the connection is live or dropped.
    function handleConnect() {
      setIsConnected(true);
    }
    function handleDisconnect() {
      setIsConnected(false);
    }
    function handleConnectError(err: Error) {
      console.error("[socket] connection error:", err.message);
      setIsConnected(false);
    }

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("connect_error", handleConnectError);

    // If the socket is already connected by the time we add the listener
    // (e.g., singleton was already initialized), reflect that immediately.
    if (s.connected) {
      setIsConnected(true);
    }

    // Cleanup function — runs when the component unmounts OR when the
    // effect dependencies change. This is one of React's most important
    // patterns: every subscription must have a teardown.
    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("connect_error", handleConnectError);
      // We DON'T disconnect the socket here. The singleton stays alive
      // across mounts/unmounts of components using it. Only logout
      // (in AuthContext) actually tears down the socket.
    };
  }, []);

  return { socket, isConnected };
}