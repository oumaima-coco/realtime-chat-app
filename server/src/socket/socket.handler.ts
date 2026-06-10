// Socket.io connection handler.
// Now with database persistence: every message is saved BEFORE broadcasting.

import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../types/socket.types.js";
import { isUserInRoom } from "../services/rooms.service.js";
import { saveMessage } from "../services/messages.service.js";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerSocketHandlers(io: TypedServer, socket: TypedSocket): void {
  const user = socket.data.user;

  console.log(`[socket] connected:    ${user.username} (id=${user.id})`);

  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${user.username} (reason: ${reason})`);
  });

  socket.on("room:join", async (payload, ack) => {
    const roomId = payload?.roomId;
    if (typeof roomId !== "string" || roomId.length === 0) {
      ack({ ok: false, error: "Invalid room ID" });
      return;
    }

    const isMember = await isUserInRoom(roomId, user.id);
    if (!isMember) {
      ack({ ok: false, error: "Not a member of this room" });
      return;
    }

    socket.join(roomId);
    console.log(`[socket] ${user.username} joined room ${roomId}`);
    ack({ ok: true });
  });

  socket.on("room:leave", (payload) => {
    const roomId = payload?.roomId;
    if (typeof roomId === "string" && roomId.length > 0) {
      socket.leave(roomId);
      console.log(`[socket] ${user.username} left room ${roomId}`);
    }
  });

  socket.on("message:send", async (payload, ack) => {
    const roomId = payload?.roomId;
    const content = typeof payload?.content === "string" ? payload.content.trim() : "";

    // Input validation.
    if (typeof roomId !== "string" || roomId.length === 0) {
      ack({ ok: false, error: "Invalid room ID" });
      return;
    }
    if (content.length === 0) {
      ack({ ok: false, error: "Message content cannot be empty" });
      return;
    }
    if (content.length > 2000) {
      ack({ ok: false, error: "Message is too long (max 2000 characters)" });
      return;
    }

    // Authorization.
    const isMember = await isUserInRoom(roomId, user.id);
    if (!isMember) {
      ack({ ok: false, error: "Not a member of this room" });
      return;
    }

    // ---- DUAL-WRITE PATTERN ----
    // Step 1: persist to the database. If this throws (DB down,
    // connection lost), we never broadcast — clients won't see a message
    // that doesn't exist in storage.
    try {
      const message = await saveMessage(roomId, user.id, content);

      // Step 2: broadcast to all sockets in this room.
      // We use the database-generated id and createdAt timestamp so the
      // broadcast matches exactly what's in the DB.
      io.to(roomId).emit("message:new", message);

      ack({ ok: true });
    } catch (err) {
      console.error("Failed to save/broadcast message:", err);
      ack({ ok: false, error: "Failed to send message" });
    }
  });
}