// Auth controller — the HTTP-facing layer.
//
// Controllers should be "thin": validate input → call service → format
// response. Any time a controller starts containing business logic
// (password hashing, database queries, etc.), that logic should move
// into a service.

import type { Request, Response } from "express";
import { z } from "zod";
import { credentialsSchema } from "../schemas/auth.schema.js";
import {
  registerUser,
  loginUser,
  AuthError,
} from "../services/auth.service.js";

// POST /auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Validate body against the schema. If invalid, parse() throws a
    // ZodError, which our centralized error handler converts to a 400.
    // If valid, we get back a typed { username, password } object.
    const { username, password } = credentialsSchema.parse(req.body);

    const { user, token } = await registerUser(username, password);

    // 201 = "Created" — the right status code for endpoints that create
    // a new resource. (200 "OK" is for everything else.)
    res.status(201).json({ user, token });
  } catch (err) {
    handleAuthError(err, res);
  }
}

// POST /auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = credentialsSchema.parse(req.body);
    const { user, token } = await loginUser(username, password);
    res.status(200).json({ user, token });
  } catch (err) {
    handleAuthError(err, res);
  }
}

// GET /auth/me
// Returns the currently authenticated user. The auth middleware has
// already verified the JWT and attached req.user, so this controller
// is trivial — just echo back what the middleware gave us.
export function getMe(req: Request, res: Response): void {
  // The "!" non-null assertion tells TypeScript: trust me, req.user is
  // defined here. We can promise this because /me is always protected
  // by requireAuth middleware, which guarantees req.user is set before
  // this controller runs. If we ever forgot to add requireAuth to a
  // route that calls this, we'd get a clean runtime crash — easier to
  // catch than a subtle bug.
  res.status(200).json({ user: req.user! });
}

// Centralized error handler.
//
// Mapping different error types to HTTP status codes is a core skill of
// backend development. Each error type has a "right" status code:
//   - Validation errors → 400 Bad Request
//   - Auth errors (wrong password, missing token) → 401/409 depending
//   - Unknown errors → 500 Internal Server Error (and log server-side,
//                       never leak details to the client)
function handleAuthError(err: unknown, res: Response): void {
  if (err instanceof z.ZodError) {
    // Validation failed. Extract the human-friendly messages and field
    // names from each issue, send them in the response so the frontend
    // can show useful error UI ("Username too short", etc.).
    res.status(400).json({
      error: "Invalid input",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof AuthError) {
    // Our custom auth errors carry their own status code (set by the service).
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Anything else is a real "we don't know what happened" error.
  // Log it server-side for debugging, but return a generic 500 to the
  // client — NEVER leak stack traces or internal error details over the
  // wire. They can contain DB schema info, file paths, library versions,
  // anything an attacker could use.
  console.error("Unexpected auth error:", err);
  res.status(500).json({ error: "Internal server error" });
}