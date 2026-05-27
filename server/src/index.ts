// Entry point of the backend server.

import express from "express";
import cors from "cors";

import { env } from "./config/env.js";
import { requestLogger } from "./middleware/logger.js";
import { verifyDatabaseConnection } from "./db/pool.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// ---- Global middleware ----
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(requestLogger);

// ---- Routes ----
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);

// ---- Startup ----
async function start(): Promise<void> {
  try {
    await verifyDatabaseConnection();
    app.listen(env.PORT, () => {
      console.log(`✓ Server running at http://localhost:${env.PORT}`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Health: http://localhost:${env.PORT}/health`);
      console.log(`  Auth:   http://localhost:${env.PORT}/auth/{register,login,me}`);
    });
  } catch (err) {
    console.error("✗ Startup failed:", err);
    process.exit(1);
  }
}

start();