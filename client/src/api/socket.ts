// Socket.io client setup.
//
// Pattern: a single connection per logged-in user, managed centrally.
// Components don't create their own connections — they call connectSocket()
// when they need to be online and disconnectSocket() when they're done.

import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../types/socket.types";

const API_URL = import.meta.env.VITE_API_URL!;

// Typed Socket — generic args order is reversed compared to the server!
// On the client side: <ServerToClientEvents, ClientToServerEvents>
// On the server side: <ClientToServerEvents, ServerToClientEvents, ...>
// This is just how socket.io-client's typings work. Easy to get wrong if
// you don't know it.
export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Module-level variable holding the current socket. null when disconnected.
// Using a module-level variable is the simplest "singleton" pattern —
// every import of this file references the same `socket` variable.
let socket: ChatSocket | null = null;

// Open a connection to the backend with the user's JWT.
// Called by the Chat page when it mounts (only after user is authenticated).
export function connectSocket(token: string): ChatSocket {
  // If a socket already exists, return it instead of creating a duplicate.
  // This handles the case of a component re-mounting unexpectedly.
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(API_URL, {
    // The "auth" field is sent during the connection handshake.
    // The server's authenticateSocket middleware reads it via
    // socket.handshake.auth.token.
    auth: { token },

    // By default Socket.io tries WebSocket first and falls back to
    // HTTP long-polling if WebSockets are blocked. Both work, but
    // WebSockets are faster. Forcing WebSockets in dev makes it obvious
    // when something is wrong with the WebSocket setup.
    transports: ["websocket"],

    // Reconnect automatically if the connection drops (network blip, etc.).
    // The defaults are sensible; we just enable explicitly for clarity.
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000, // ms — wait 1s, then 2s, then 4s, etc.
  });

  return socket;
}

// Disconnect cleanly. Called when the user logs out or unmounts Chat.
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Access the current socket. Returns null if not connected.
// Components shouldn't usually call this directly — they should use the
// useSocket hook (Step 10) which gives them a typed, lifecycle-aware ref.
export function getSocket(): ChatSocket | null {
  return socket;
}