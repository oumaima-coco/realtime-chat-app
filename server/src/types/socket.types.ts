// Event shapes for the Socket.io connection.

// ----- Events SERVER → CLIENT -----
export interface ServerToClientEvents {
  "message:new": (message: ChatMessage) => void;
  "message:error": (payload: { message: string }) => void;

  // Presence — broadcast when a user comes online or goes offline.
  "presence:online": (payload: { userId: string }) => void;
  "presence:offline": (payload: { userId: string }) => void;

  // Initial presence snapshot — sent in response to "presence:request".
  // Used by clients on page load to get the full list of who's online.
  "presence:snapshot": (payload: { onlineUserIds: string[] }) => void;

  // Typing indicators — emitted only to clients in the relevant room.
  "typing:start": (payload: { roomId: string; userId: string; username: string }) => void;
  "typing:stop": (payload: { roomId: string; userId: string }) => void;
}

// ----- Events CLIENT → SERVER -----
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

  // Request the current presence snapshot. Client calls this on connection.
  "presence:request": (
    ack: (payload: { onlineUserIds: string[] }) => void,
  ) => void;

  // Typing — broadcast (within room scope only).
  "typing:start": (payload: { roomId: string }) => void;
  "typing:stop": (payload: { roomId: string }) => void;
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