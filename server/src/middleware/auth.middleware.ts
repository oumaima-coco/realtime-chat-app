// Auth middleware. Protects routes by verifying a JWT.
//
// Usage:
//   import { requireAuth } from "../middleware/auth.middleware.js";
//   router.get("/protected", requireAuth, controller);
//
// What requireAuth does, in order:
//   1. Extract the JWT from the "Authorization: Bearer <token>" header.
//   2. Verify the signature using JWT_SECRET (rejects expired/tampered tokens).
//   3. Look up the user in the database (so deleted-user tokens fail).
//   4. Attach the user to req.user so downstream code can use it.
//   5. Call next() to continue.
//
// Any failure along the way → 401 Unauthorized, the request stops here.

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getUserById, type PublicUser } from "../services/auth.service.js";

// We're adding a "user" property to Express's Request type.
//
// TypeScript wouldn't normally know about this — Express's built-in
// Request type has no `user` field. This `declare global` block extends
// Express's type globally, so anywhere in the project that has a Request,
// it'll know `req.user` exists and is a PublicUser | undefined.
//
// The `?` after `user` makes it optional, because not every request has
// a user (unauthenticated routes don't run this middleware).
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

// Shape of our JWT payload. We only put the user ID ("sub" claim) in it.
// "iat" (issued-at) and "exp" (expiry) are added automatically by jwt.sign().
interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // ---- Step 1: extract the token from the Authorization header ----
  //
  // Standard format: "Authorization: Bearer eyJhbGc..."
  // The "Bearer" scheme is the convention for JWTs — clients must use it.
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Missing or malformed Authorization header",
    });
    return;
  }

  // Strip the "Bearer " prefix to get just the token string.
  const token = authHeader.substring("Bearer ".length);

  // ---- Step 2: verify the signature ----
  //
  // jwt.verify throws if anything is wrong: bad signature, expired token,
  // malformed payload, etc. The library handles all those cases for us;
  // we just need to handle the throw.
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT.SECRET) as JwtPayload;
  } catch (err) {
    // Don't leak details about WHY the token failed (don't tell the client
    // "token expired 3 hours ago" — that's a minor enumeration vector).
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // ---- Step 3: look up the user in the database ----
  //
  // Why hit the DB on every authenticated request?
  //   - If a user is deleted, their existing tokens stop working immediately.
  //   - We always have fresh user data (no stale username, etc.).
  //
  // The downside is one DB query per authenticated request. For our scale
  // it's fine. At higher scale you'd add a short-lived in-memory cache here.
  const user = await getUserById(payload.sub);
  if (!user) {
    res.status(401).json({ error: "User no longer exists" });
    return;
  }

  // ---- Step 4: attach the user to the request ----
  //
  // Now any downstream middleware or controller can read req.user and
  // know who's making the request. This is the canonical pattern for
  // sharing per-request data across middleware in Express.
  req.user = user;

  // ---- Step 5: continue the middleware chain ----
  next();
}