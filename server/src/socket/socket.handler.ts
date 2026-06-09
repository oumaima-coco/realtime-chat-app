// Socket.io connection handler — multi-room edition.

import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ChatMessage,
} from "../types/socket.types.js";
import { randomUUID } from "node:crypto";
import { isUserInRoom } from "../services/rooms.service.js";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerSocketHandlers(io: TypedServer, socket: TypedSocket): void {
  const user = socket.data.user;

  console.log(`[socket] connected:    ${user.username} (id=${user.id})`);

  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${user.username} (reason: ${reason})`);
  });

  // Subscribe this socket to a room's broadcast group.
  socket.on("room:join", async (payload, ack) => {
    const roomId = payload?.roomId;
    if (typeof roomId !== "string" || roomId.length === 0) {
      ack({ ok: false, error: "Invalid room ID" });
      return;
    }

    // Verify the user is a database-member. We don't trust the client to
    // tell us which rooms it's "allowed" in — we check ourselves.
    const isMember = await isUserInRoom(roomId, user.id);
    if (!isMember) {
      ack({ ok: false, error: "Not a member of this room" });
      return;
    }

    // socket.join() is Socket.io's built-in room subscription.
    // After this, io.to(roomId).emit(...) will deliver to this socket.
    socket.join(roomId);
    console.log(`[socket] ${user.username} joined room ${roomId}`);
    ack({ ok: true });
  });

  // Unsubscribe from a room's broadcasts. No DB-level change.
  socket.on("room:leave", (payload) => {
    const roomId = payload?.roomId;
    if (typeof roomId === "string" && roomId.length > 0) {
      socket.leave(roomId);
      console.log(`[socket] ${user.username} left room ${roomId}`);
    }
  });

  // Send a message to a specific room.
  socket.on("message:send", async (payload, ack) => {
    const roomId = payload?.roomId;
    const content = typeof payload?.content === "string" ? payload.content.trim() : "";

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

    // Authorization: confirm the user is allowed to post to this room.
    // We re-check on every message — never trust the client's claim that
    // they're in a room.
    const isMember = await isUserInRoom(roomId, user.id);
    if (!isMember) {
      ack({ ok: false, error: "Not a member of this room" });
      return;
    }

    const message: ChatMessage = {
      id: randomUUID(),
      roomId,
      content,
      senderId: user.id,
      senderUsername: user.username,
      createdAt: new Date().toISOString(),
    };

    // Emit to all sockets in this room (including the sender's).
    // io.to(roomId) is the room-scoped version of io.emit().
    io.to(roomId).emit("message:new", message);

    ack({ ok: true });
  });
}