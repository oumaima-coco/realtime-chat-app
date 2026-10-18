import { useEffect, useState } from "react";
import { connectSocket, type ChatSocket } from "../api/socket";
import { STORAGE_KEYS } from "../api/axios";

export function useSocket() {
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      return;
    }

    const s = connectSocket(token);
    setSocket(s);

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

    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("connect_error", handleConnectError);
    };
  }, []);

  return { socket, isConnected };
}