// Entry point of the backend server.
//
// Responsibilities (kept narrow on purpose):
//   1. Load config
//   2. Create the Express app
//   3. Register global middleware (logging, CORS, JSON parsing)
//   4. Mount routes
//   5. Start the server listening on the configured port
//
// All actual business logic lives in controllers/middleware/routes.
// This file should stay short — when it grows past ~50 lines, that's a
// sign something belongs in its own file.

import express from "express";
import cors from "cors";

import { env } from "./config/env.js";
import { requestLogger } from "./middleware/logger.js";
import healthRoutes from "./routes/health.routes.js";

// Create the Express application.
const app = express();

// ---- Global middleware ----
// Order matters! Middleware runs in the order it's registered.

// Enable CORS so the frontend (running on a different port) can call this API.
// We pass an options object explicitly listing the allowed origin instead of
// using a permissive default — being explicit is the safer pattern.
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,  // Allow cookies/auth headers to be sent across origins.
  }),
);

// Parse incoming JSON bodies. Without this, req.body is undefined when a
// client POSTs JSON. We'll need this for /auth/register and /auth/login later.
app.use(express.json());

// Our custom logger. Registered AFTER cors/json-parser so it can log the
// final method/url info accurately.
app.use(requestLogger);

// ---- Routes ----
// Mount the health router at /health. So router.get("/", ...) in
// health.routes.ts becomes GET /health here. Path concatenation.
app.use("/health", healthRoutes);

// ---- Start listening ----
// app.listen tells Express to open a port and start accepting connections.
// The callback fires once the server is ready.
app.listen(env.PORT, () => {
  console.log(`✓ Server running at http://localhost:${env.PORT}`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Health check: http://localhost:${env.PORT}/health`);
});