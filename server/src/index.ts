// Entry point of the backend server.
// Serves both Express (HTTP API) and Socket.io (WebSockets)
// on the same port, both authenticated by the same JWT.

import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

import { env } from "./config/env.js";
import { requestLogger } from "./middleware/logger.js";
import { verifyDatabaseConnection } from "./db/pool.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { authenticateSocket } from "./socket/socket.middleware.js";
import { registerSocketHandlers } from "./socket/socket.handler.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types/socket.types.js";

const app = express();

// ---- Global middleware ----
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(requestLogger);

// ---- Routes ----
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);

// ---- HTTP server ----
// Until now we used app.listen() directly. Express internally creates an
// http.Server for that. We now do it manually so we can attach Socket.io
// to the same server — both layers served on the same port.
const httpServer = createServer(app);

// ---- Socket.io server ----
// Generic args order: ClientToServer, ServerToClient, InterServer, SocketData.
// Inlined on one line to avoid paste mangling of angle brackets.
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: { origin: env.CLIENT_ORIGIN, credentials: true },
});

// Apply auth middleware to every incoming connection.
io.use(authenticateSocket);

// Set up event handlers for each authenticated connection.
io.on("connection", (socket) => {
  registerSocketHandlers(io, socket);
});

// ---- Startup ----
async function start(): Promise<void> {
  try {
    await verifyDatabaseConnection();
    httpServer.listen(env.PORT, () => {
      console.log(`✓ Server running at http://localhost:${env.PORT}`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Health:    http://localhost:${env.PORT}/health`);
      console.log(`  Auth:      http://localhost:${env.PORT}/auth/{register,login,me}`);
      console.log(`  Socket.io: ws://localhost:${env.PORT}/socket.io`);
    });
  } catch (err) {
    console.error("✗ Startup failed:", err);
    process.exit(1);
  }
}

start();