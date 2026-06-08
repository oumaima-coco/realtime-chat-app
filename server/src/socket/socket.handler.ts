// Socket.io connection handler — runs once per authenticated connection.

import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ChatMessage,
} from "../types/socket.types.js";
import { randomUUID } from "node:crypto";

// Typed Server and Socket aliases.
// We use single-line generics here to avoid paste mangling.
// Generic args order: ClientToServer, ServerToClient, InterServer, SocketData.
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// Phase 7 design choice: one big global "lobby" where every message
// is broadcast to every connected client. No per-room logic yet.
// Phase 8 will replace this with proper rooms.
export function registerSocketHandlers(io: TypedServer, socket: TypedSocket): void {
  const user = socket.data.user;

  console.log(`[socket] connected:    ${user.username} (id=${user.id})`);

  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${user.username} (reason: ${reason})`);
  });

  socket.on("message:send", (payload, ack) => {
    // Validate the incoming data. Auth doesn't guarantee well-formed inputs.
    const content =
      typeof payload?.content === "string" ? payload.content.trim() : "";

    if (content.length === 0) {
      ack({ ok: false, error: "Message content cannot be empty" });
      return;
    }
    if (content.length > 2000) {
      ack({ ok: false, error: "Message is too long (max 2000 characters)" });
      return;
    }

    // Build the message. In Phase 9 we'll persist these to PostgreSQL
    // and use the database-generated ID. For now, generate in-memory.
    const message: ChatMessage = {
      id: randomUUID(),
      content,
      senderId: user.id,
      senderUsername: user.username,
      createdAt: new Date().toISOString(),
    };

    // Broadcast to every connected client — including the sender.
    io.emit("message:new", message);

    ack({ ok: true });
  });
}