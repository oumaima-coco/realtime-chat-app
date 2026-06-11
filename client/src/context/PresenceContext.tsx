// PresenceContext — tracks which users are currently online.
//
// Maintains a Set of online userIds. Subscribes to presence:online and
// presence:offline events from the server, and on mount asks the server
// for the initial snapshot.
//
// Why a Set instead of an array? Because we constantly check "is this
// user online?" by userId — Set.has() is O(1), array.includes() is O(n).
// For 10 users no difference; for 10,000 users it matters.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSocket } from "../hooks/useSocket";

interface PresenceContextValue {
  onlineUserIds: Set<string>;
  isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useSocket();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket || !isConnected) return;

    // ---- Request the snapshot once on connection ----
    // This handles the initial state: "who's already online right now?"
    // We use the acknowledgment callback pattern instead of a separate
    // event — it's a one-shot request, ack is the right tool.
    socket.emit("presence:request", ({ onlineUserIds: snapshot }) => {
      setOnlineUserIds(new Set(snapshot));
    });

    // ---- Subscribe to live updates ----
    function handleOnline({ userId }: { userId: string }) {
      setOnlineUserIds((prev) => {
        // Important: create a NEW Set rather than mutating the existing one.
        // React compares by reference — mutating wouldn't trigger a re-render.
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    }

    function handleOffline({ userId }: { userId: string }) {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }

    socket.on("presence:online", handleOnline);
    socket.on("presence:offline", handleOffline);

    return () => {
      socket.off("presence:online", handleOnline);
      socket.off("presence:offline", handleOffline);
    };
  }, [socket, isConnected]);

  function isOnline(userId: string): boolean {
    return onlineUserIds.has(userId);
  }

  return (
    <PresenceContext.Provider value={{ onlineUserIds, isOnline }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence(): PresenceContextValue {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error("usePresence must be used within a PresenceProvider");
  }
  return context;
}