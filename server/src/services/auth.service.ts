// Auth service — all the actual logic for registration and login lives here.
//
// Architectural note: why a separate "service" layer instead of putting
// code directly in the controller?
//
//   - Controllers should only handle HTTP concerns: parsing the request,
//     calling business logic, formatting the response, choosing status codes.
//
//   - Services contain the actual business logic. They don't know about
//     HTTP — no req, no res, no status codes. They take inputs, do work,
//     and either return values or throw errors.
//
//   - This separation means:
//       1. The same service can be called from multiple places (HTTP
//          controller, WebSocket handler, CLI script, test).
//       2. Tests don't need to mock HTTP — they just call the function.
//       3. The business rules are isolated from transport concerns.

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";

// The bcrypt "cost factor" controls how slow hashing is.
// 12 is the modern default — ~200ms per hash. That's imperceptible to
// a human logging in, but agonizing for an attacker trying to brute-force
// (millions of guesses become millions of seconds).
// Increase this as CPUs get faster in future years.
const BCRYPT_COST = 12;

// ---- Internal types ----

// Shape of a user row as it lives in the database.
// We never expose password_hash to clients — this type is internal-only.
interface UserRow {
  id: string;        // BIGSERIAL → returned as string by pg (avoids JS number precision loss for huge IDs).
  username: string;
  password_hash: string;
  created_at: Date;
}

// Shape of a user that's safe to expose externally. No password hash.
// Use camelCase here (web convention) even though DB uses snake_case (SQL convention).
export interface PublicUser {
  id: string;
  username: string;
  createdAt: Date;
}

// ---- Errors ----

// Custom error class so the controller can distinguish "user-facing"
// errors (which carry an appropriate HTTP status code) from unexpected
// errors (which should be 500s with no detail leaked).
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// ---- Helpers ----

// Convert internal UserRow → PublicUser. Single source of truth for the
// transformation, so we can never accidentally leak password_hash by
// forgetting to strip it.
function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
  };
}

// Sign a JWT for a given user ID.
//
// We deliberately keep the payload tiny — just the user ID. Why?
//   1. JWT payloads are base64-encoded, not encrypted. Anyone can read them.
//      Putting an email or any sensitive info there leaks it.
//   2. Every request includes the token in headers — bigger token = more
//      bytes on every request = slower.
//   3. If we cached the username in the token and the user changed their
//      username, the token would have stale data. Better to always look up
//      fresh from the DB.
function signToken(userId: string): string {
  // "sub" is the standard JWT claim name for "subject" (who the token is about).
  // Using standard claim names (sub, iat, exp, iss) is a convention worth
  // following — interoperable with any JWT library or tool.
  const payload = { sub: userId };

  const options: SignOptions = {
    expiresIn: env.JWT.EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT.SECRET, options);
}

// Type guard for Postgres errors. The pg library throws errors with a
// `code` property identifying what went wrong (23505 = unique violation, etc.).
function isPostgresError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

// ---- Public service functions ----

// Register a new user. Hashes the password, inserts into the DB, returns
// the new user info + a JWT.
export async function registerUser(
  username: string,
  password: string,
): Promise<{ user: PublicUser; token: string }> {
  // Hash BEFORE the database insert. If hashing throws, we haven't
  // created an account yet — failure mode is clean.
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    // INSERT ... RETURNING * is a Postgres feature: insert a row and get
    // it back in a single query. Saves a round-trip vs. insert-then-select.
    //
    // $1 and $2 are positional parameters. The pg library substitutes
    // them safely — this PREVENTS SQL INJECTION. Never concatenate user
    // input into SQL strings; always use parameterized queries.
    const result = await pool.query<UserRow>(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, password_hash, created_at`,
      [username, passwordHash],
    );

    const user = toPublicUser(result.rows[0]);
    const token = signToken(user.id);
    return { user, token };
  } catch (err) {
    // Postgres error code 23505 = unique_violation. We get this when the
    // UNIQUE constraint on username is violated (someone else registered
    // that name first).
    if (isPostgresError(err) && err.code === "23505") {
      throw new AuthError("Username is already taken", 409);
      // 409 = "Conflict" — the right status code when the request is
      // valid but conflicts with the current state of the resource.
    }
    throw err;
  }
}

// Log in an existing user. Verifies the password and returns user + token.
export async function loginUser(
  username: string,
  password: string,
): Promise<{ user: PublicUser; token: string }> {
  // LOWER() on both sides makes username lookup case-insensitive.
  // We have a UNIQUE INDEX on LOWER(username) (from migration 001) so
  // this query uses the index and stays fast.
  const result = await pool.query<UserRow>(
    `SELECT id, username, password_hash, created_at
     FROM users
     WHERE LOWER(username) = LOWER($1)`,
    [username],
  );

  const userRow = result.rows[0];

  // SECURITY: identical error message for "user doesn't exist" and
  // "wrong password." Otherwise an attacker can probe which usernames
  // are registered — called "user enumeration."
  // The downside: when a real user typos their username, the error is
  // slightly less helpful. Industry consensus says this tradeoff is
  // worth it.
  if (!userRow) {
    throw new AuthError("Invalid username or password", 401);
  }

  const passwordMatches = await bcrypt.compare(password, userRow.password_hash);
  if (!passwordMatches) {
    throw new AuthError("Invalid username or password", 401);
  }

  const user = toPublicUser(userRow);
  const token = signToken(user.id);
  return { user, token };
}

// Look up a user by ID. Used by the auth middleware after verifying a JWT.
// Returns null if no such user exists (e.g., the account was deleted but
// the token is still floating around).
export async function getUserById(id: string): Promise<PublicUser | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, username, password_hash, created_at
     FROM users
     WHERE id = $1`,
    [id],
  );

  const userRow = result.rows[0];
  return userRow ? toPublicUser(userRow) : null;
}