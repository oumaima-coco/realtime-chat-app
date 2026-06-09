// Event shapes for the Socket.io connection.

// Events the SERVER emits TO the client.
export interface ServerToClientEvents {
  "message:new": (message: ChatMessage) => void;
  "message:error": (payload: { message: string }) => void;
}

// Events the CLIENT emits TO the server.
export interface ClientToServerEvents {
  // Subscribe to a room's real-time messages.
  // The user must already be a database-member of the room (verified server-side).
  "room:join": (
    payload: { roomId: string },
    ack: (response: { ok: true } | { ok: false; error: string }) => void,
  ) => void;

  // Unsubscribe from a room's real-time messages.
  // Does NOT remove the user from the room's membership in the database —
  // it just stops them receiving messages in their current session.
  "room:leave": (payload: { roomId: string }) => void;

  // Send a message to a specific room.
  "message:send": (
    payload: { roomId: string; content: string },
    ack: (response: { ok: true } | { ok: false; error: string }) => void,
  ) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: { id: string; username: string };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  content: string;
  senderId: string;
  senderUsername: string;
  createdAt: string;
}