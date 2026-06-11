// Event shapes for the Socket.io connection.
// MUST stay in sync with server/src/types/socket.types.ts.

export interface ServerToClientEvents {
  "message:new": (message: ChatMessage) => void;
  "message:error": (payload: { message: string }) => void;

  "presence:online": (payload: { userId: string }) => void;
  "presence:offline": (payload: { userId: string }) => void;
  "presence:snapshot": (payload: { onlineUserIds: string[] }) => void;

  "typing:start": (payload: { roomId: string; userId: string; username: string }) => void;
  "typing:stop": (payload: { roomId: string; userId: string }) => void;
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

  "presence:request": (
    ack: (payload: { onlineUserIds: string[] }) => void,
  ) => void;

  "typing:start": (payload: { roomId: string }) => void;
  "typing:stop": (payload: { roomId: string }) => void;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  content: string;
  senderId: string;
  senderUsername: string;
  createdAt: string;
}