// Loads environment variables from .env into process.env, then exposes them
// in a structured, type-safe object. Anywhere else in the code that needs
// config values should import from THIS file rather than reading process.env
// directly — that way we have one source of truth for what env vars exist
// and what they mean.

import dotenv from "dotenv";

// dotenv.config() reads the .env file from the project root and populates
// process.env (Node's built-in object holding environment variables).
// This must run BEFORE we read any env vars below.
dotenv.config();

// Helper: read a required env var and throw if it's missing.
// We crash on startup instead of silently using `undefined` and breaking
// later in confusing ways. This is a defensive programming pattern called
// "fail fast" — better to discover misconfiguration immediately than at
// runtime when a user is trying to use the app.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Export a single config object. Anywhere in the app that needs a config
// value imports this and uses `env.PORT`, `env.CLIENT_ORIGIN`, etc.
// Benefits:
//   1. TypeScript autocomplete shows you what's available.
//   2. If you typo `env.PROT` it's a compile error, not a silent undefined.
//   3. Adding a new env var = update this file = everywhere benefits.
export const env = {
  PORT: Number(process.env.PORT) || 3000,  // Number() converts string -> number; fallback to 3000 if missing.
  NODE_ENV: process.env.NODE_ENV ?? "development",  // ?? means "use the right side if left is null/undefined"
  CLIENT_ORIGIN: requireEnv("CLIENT_ORIGIN"),
} as const;
//   ^^^^^^^^^ "as const" tells TypeScript to treat this object as deeply
//   readonly. The values become literal types instead of generic strings.
//   It's a small thing but it prevents bugs where someone accidentally
//   reassigns env values at runtime.