// Event shapes for the Socket.io connection.
// MUST stay in sync with server/src/types/socket.types.ts.

export interface ServerToClientEvents {
  "message:new": (message: ChatMessage) => void;
  "message:error": (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  "room:join": (
    payload: { roomId: string },
    ack: (response: { ok: true } | { ok: false; error: string }) => void,
  ) => void;

  "room:leave": (payload: { roomId: string }) => void;

  "message:send": (
    payload: { roomId: string; content: string },
    ack: (response: { ok: true } | { ok: false; error: string }) => void,
  ) => void;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  content: string;
  senderId: string;
  senderUsername: string;
  createdAt: string;
}