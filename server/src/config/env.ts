// Loads environment variables from .env into process.env, then exposes them
// in a structured, type-safe object. Anywhere else in the code that needs
// config values should import from THIS file rather than reading process.env
// directly — that way we have one source of truth for what env vars exist
// and what they mean.

import dotenv from "dotenv";

dotenv.config();

// Helper: read a required env var and throw if it's missing.
// "Fail fast" pattern — better to discover misconfiguration immediately
// than at runtime when a user hits the bug.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  // Server
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  CLIENT_ORIGIN: requireEnv("CLIENT_ORIGIN"),

  // Database
  DATABASE: {
    HOST: requireEnv("DATABASE_HOST"),
    PORT: Number(requireEnv("DATABASE_PORT")),
    NAME: requireEnv("DATABASE_NAME"),
    USER: requireEnv("DATABASE_USER"),
    PASSWORD: requireEnv("DATABASE_PASSWORD"),
  },

  // Authentication — JWT signing secret and token expiry.
  // JWT_EXPIRES_IN uses jsonwebtoken's shorthand: "7d" = 7 days,
  // "24h" = 24 hours, "60m" = 60 minutes, etc.
  JWT: {
    SECRET: requireEnv("JWT_SECRET"),
    EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  },
} as const;