// Entry point of the backend server.
// Now hardened with security middleware.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

import { env } from "./config/env.js";
import { requestLogger } from "./middleware/logger.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middleware/error-handler.middleware.js";
import { apiRateLimiter } from "./middleware/rate-limit.middleware.js";
import { verifyDatabaseConnection } from "./db/pool.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import { authenticateSocket } from "./socket/socket.middleware.js";
import { registerSocketHandlers } from "./socket/socket.handler.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types/socket.types.js";

const app = express();

// ---- SECURITY MIDDLEWARE (must come first) ----

// Helmet sets a bundle of security-related HTTP headers automatically.
// What it includes by default:
//   - X-Content-Type-Options: nosniff (prevents MIME-sniffing attacks)
//   - X-Frame-Options: SAMEORIGIN (prevents clickjacking)
//   - Strict-Transport-Security (forces HTTPS — kicks in once deployed)
//   - Content-Security-Policy (controls what resources the page can load)
//   - and about 10 more
//
// Each header is small but adds up to a much harder-to-attack server.
app.use(helmet({
  // We disable CSP in dev because Vite's dev server uses inline scripts/styles.
  // In production this should be configured strictly.
  contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
}));

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

// Body parser with a SIZE LIMIT. Without this, a malicious client could
// send a 1GB JSON body and exhaust server memory. 100kb is plenty for
// our chat app — even a 2000-character message in JSON is ~2kb.
app.use(express.json({ limit: "100kb" }));

app.use(requestLogger);

// Apply the lenient API rate limiter to ALL routes.
// Specific routes (like auth) can override with stricter limits.
app.use(apiRateLimiter);

// ---- ROUTES ----
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/rooms", roomsRoutes);

// 404 handler for unmatched routes. Must come AFTER all real routes.
app.use(notFoundHandler);

// Global error handler. Must come LAST — after all routes and other middleware.
app.use(globalErrorHandler);

// ---- HTTP server ----
const httpServer = createServer(app);

// ---- Socket.io server ----
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  // Limit the size of WebSocket payloads to prevent memory exhaustion attacks.
  maxHttpBufferSize: 100_000,  // 100kb per message — generous for chat.
});

io.use(authenticateSocket);

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