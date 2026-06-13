// Loads environment variables from .env into process.env, then exposes them
// in a structured, type-safe object. Anywhere else in the code that needs
// config values should import from THIS file rather than reading process.env
// directly — that way we have one source of truth for what env vars exist
// and what they mean.

import dotenv from "dotenv";

dotenv.config();

// Helper: read a required env var and throw if it's missing.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Database config: support EITHER a single DATABASE_URL connection string
// (what cloud providers like Supabase / Railway / Heroku give you),
// OR individual host/port/user/password variables (what we use in local dev).
// We try DATABASE_URL first; if it's not set, we fall back to the pieces.
function buildDatabaseConfig() {
  const url = process.env.DATABASE_URL;
  if (url && url.length > 0) {
    return { URL: url } as const;
  }
  return {
    HOST: requireEnv("DATABASE_HOST"),
    PORT: Number(requireEnv("DATABASE_PORT")),
    NAME: requireEnv("DATABASE_NAME"),
    USER: requireEnv("DATABASE_USER"),
    PASSWORD: requireEnv("DATABASE_PASSWORD"),
  } as const;
}

// CORS allowed origins. We support a comma-separated list so dev + prod
// origins can coexist. Example value:
//   CLIENT_ORIGIN=http://localhost:5173,https://my-app.vercel.app
function parseClientOrigins(): string[] {
  const raw = requireEnv("CLIENT_ORIGIN");
  return raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}

export const env = {
  // Server
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  // Single origin (for older code paths that expect a string)
  // AND the full list (for CORS middleware that accepts arrays).
  CLIENT_ORIGIN: parseClientOrigins(),

  // Database — see buildDatabaseConfig above for the dual-format support.
  DATABASE: buildDatabaseConfig(),

  // Authentication
  JWT: {
    SECRET: requireEnv("JWT_SECRET"),
    EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  },
} as const;