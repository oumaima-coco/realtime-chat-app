import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getUserById } from "../services/auth.service.js";

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

export async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || token.length === 0) {
      return next(new Error("Missing authentication token"));
    }

    const payload = jwt.verify(token, env.JWT.SECRET) as JwtPayload;

    const user = await getUserById(payload.sub);
    if (!user) {
      return next(new Error("User no longer exists"));
    }

    socket.data.user = {
      id: user.id,
      username: user.username,
    };

    next();
  } catch (err) {
    return next(new Error("Invalid or expired token"));
  }
}