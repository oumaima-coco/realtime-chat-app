// Shape definitions for every event flowing between client and server
// over the WebSocket connection.
//
// Why bother typing these? Because typos in event names ("messag:send"
// instead of "message:send") and shape mismatches ({ content } vs
// { text }) are some of the most common Socket.io bugs. Strong typing
// catches them at compile time instead of at runtime.

// Events the SERVER emits TO the client.
// The interface name "ServerToClientEvents" is the conventional name
// Socket.io itself uses in its typed API.
export interface ServerToClientEvents {
  // A new message has arrived. Broadcast to all connected clients.
  "message:new": (message: ChatMessage) => void;

  // Confirmation/error for an action the client took.
  // Useful for showing "message sent" or "failed to send" in the UI later.
  "message:error": (payload: { message: string }) => void;
}

// Events the CLIENT emits TO the server.
export interface ClientToServerEvents {
  // The user wants to send a message.
  "message:send": (
    payload: { content: string },
    // Acknowledgment callback. When the server has processed the event,
    // it calls this callback. This is Socket.io's "request-response"
    // pattern over WebSockets — useful for "did my message get through?"
    ack: (response: { ok: true } | { ok: false; error: string }) => void,
  ) => void;
}

// Inter-server events — only relevant if you scale to multiple Socket.io
// server instances coordinating with each other (via Redis adapter, etc.).
// Empty for us since we run a single server.
export interface InterServerEvents {}

// Data attached to a socket by the auth middleware.
// After auth, `socket.data.user` is available in every event handler.
export interface SocketData {
  user: {
    id: string;
    username: string;
  };
}

// Shape of a single chat message, as emitted to clients.
// In Phase 9 we'll persist these to PostgreSQL; for now they live
// only in memory.
export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  // ISO 8601 timestamp string — JSON-safe (Date doesn't serialize cleanly).
  createdAt: string;
}