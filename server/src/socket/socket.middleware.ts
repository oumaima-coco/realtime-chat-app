// Socket.io connection-time authentication middleware.
//
// Runs ONCE per connection (not per event) — by the time a message
// handler executes, the user is already verified and attached to the socket.
//
// How the client sends the token:
//   The client passes it in the "auth" field when calling io():
//     const socket = io(URL, { auth: { token: "eyJ..." } });
//   That field arrives on the server as socket.handshake.auth.token.

import type { Socket } from "socket.io";
import type { ExtendedError } from "socket.io/dist/namespace";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getUserById } from "../services/auth.service.js";

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

// Socket.io's middleware signature: (socket, next) where next is called
// with no args = "allow connection," or with an Error = "reject connection."
export async function authenticateSocket(
  socket: Socket,
  next: (err?: ExtendedError) => void,
): Promise<void> {
  try {
    // Pull the token from the handshake. The client passes it via
    // `auth: { token }` when calling io().
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || token.length === 0) {
      return next(new Error("Missing authentication token"));
    }

    // Verify the JWT signature and expiry.
    const payload = jwt.verify(token, env.JWT.SECRET) as JwtPayload;

    // Look up the user to make sure the account still exists.
    // Same defense as our HTTP middleware: deleted users can't keep using
    // old tokens.
    const user = await getUserById(payload.sub);
    if (!user) {
      return next(new Error("User no longer exists"));
    }

    // Attach the user to the socket. From now on, every event handler
    // can access it via socket.data.user.
    socket.data.user = {
      id: user.id,
      username: user.username,
    };

    // Accept the connection.
    next();
  } catch (err) {
    // JWT verification failed (expired, malformed, bad signature, etc.).
    // Reject the connection.
    return next(new Error("Invalid or expired token"));
  }
}