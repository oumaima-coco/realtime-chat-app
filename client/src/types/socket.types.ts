// Event shapes for the Socket.io connection.
// MUST stay in sync with server/src/types/socket.types.ts.
//
// Why duplicated instead of imported across packages? The frontend and
// backend deploy separately and shouldn't share TypeScript files directly.
// In a larger codebase we'd use a shared package; for this project, manual
// sync is simpler. If you change one file, update the other.

// Events the server emits TO this client.
export interface ServerToClientEvents {
  "message:new": (message: ChatMessage) => void;
  "message:error": (payload: { message: string }) => void;
}

// Events this client emits TO the server.
export interface ClientToServerEvents {
  "message:send": (
    payload: { content: string },
    ack: (response: { ok: true } | { ok: false; error: string }) => void,
  ) => void;
}

// Shape of a single chat message received from the server.
export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  createdAt: string;
}