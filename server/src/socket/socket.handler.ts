// Socket.io connection handler.
// Phase 10: adds presence tracking and typing indicators.

import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../types/socket.types.js";
import { isUserInRoom } from "../services/rooms.service.js";
import { saveMessage } from "../services/messages.service.js";
import { presence } from "./presence.js";
import { typing } from "./typing.js";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// Every authenticated socket auto-joins this special "broadcast room"
// so we can target ALL connected clients with presence updates.
const PRESENCE_BROADCAST_ROOM = "__presence__";

export function registerSocketHandlers(io: TypedServer, socket: TypedSocket): void {
  const user = socket.data.user;

  console.log(`[socket] connected:    ${user.username} (id=${user.id})`);

  // ---- Presence: track this connection and broadcast if newly online ----
  socket.join(PRESENCE_BROADCAST_ROOM);
  const becameOnline = presence.addSocket(user.id, socket.id);
  if (becameOnline) {
    // Notify all OTHER clients (socket.to skips the sender).
    socket.to(PRESENCE_BROADCAST_ROOM).emit("presence:online", { userId: user.id });
  }

  // ---- Disconnect handler ----
  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${user.username} (reason: ${reason})`);

    const becameOffline = presence.removeSocket(user.id, socket.id);
    if (becameOffline) {
      // Broadcast offline only when ALL their connections are gone.
      io.to(PRESENCE_BROADCAST_ROOM).emit("presence:offline", { userId: user.id });

      // Also clear any typing indicators they had — otherwise "Bob is
      // typing..." would persist after Bob's browser crashed.
      const roomsAffected = typing.clearAllForUser(user.id);
      for (const roomId of roomsAffected) {
        io.to(roomId).emit("typing:stop", { roomId, userId: user.id });
      }
    }
  });

  // ---- Presence snapshot request ----
  // Called by clients on connect to get the initial state.
  socket.on("presence:request", (ack) => {
    ack({ onlineUserIds: presence.getOnlineUserIds() });
  });

  // ---- Room join/leave (unchanged from Phase 9) ----
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
      // Also clear any typing state in this room — if I leave a room
      // while still typing, others shouldn't see "you are typing" linger.
      if (typing.unmarkTyping(roomId, user.id)) {
        io.to(roomId).emit("typing:stop", { roomId, userId: user.id });
      }
      console.log(`[socket] ${user.username} left room ${roomId}`);
    }
  });

  // ---- Typing indicators ----
  socket.on("typing:start", (payload) => {
    const roomId = payload?.roomId;
    if (typeof roomId !== "string" || roomId.length === 0) return;

    // Mark, and broadcast only if newly typing (avoid spam).
    if (typing.markTyping(roomId, user.id)) {
      // socket.to skips the sender — we don't show "you are typing" to yourself.
      socket.to(roomId).emit("typing:start", {
        roomId,
        userId: user.id,
        username: user.username,
      });
    }
  });

  socket.on("typing:stop", (payload) => {
    const roomId = payload?.roomId;
    if (typeof roomId !== "string" || roomId.length === 0) return;

    if (typing.unmarkTyping(roomId, user.id)) {
      socket.to(roomId).emit("typing:stop", {
        roomId,
        userId: user.id,
      });
    }
  });

  // ---- Message send (dual-write, unchanged from Phase 9) ----
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

    const isMember = await isUserInRoom(roomId, user.id);
    if (!isMember) {
      ack({ ok: false, error: "Not a member of this room" });
      return;
    }

    try {
      // When someone sends, they're definitely not still typing.
      // Clear it server-side and notify others.
      if (typing.unmarkTyping(roomId, user.id)) {
        socket.to(roomId).emit("typing:stop", { roomId, userId: user.id });
      }

      const message = await saveMessage(roomId, user.id, content);
      io.to(roomId).emit("message:new", message);
      ack({ ok: true });
    } catch (err) {
      console.error("Failed to save/broadcast message:", err);
      ack({ ok: false, error: "Failed to send message" });
    }
  });
}