// Global error handler.
// Catches errors thrown by routes/middleware and returns appropriate
// HTTP responses, mapping known error types to specific status codes.

import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

export function globalErrorHandler(
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  console.error("Global error handler caught:", {
    message: err.message,
    type: err.type,
    status: err.status ?? err.statusCode,
    url: req.originalUrl,
    method: req.method,
  });

  // Detect specific known error types and map to correct status codes.

  // Body parser: payload too large.
  // Express's express.json() throws an error with type "entity.too.large"
  // when the request body exceeds the size limit. We catch that and
  // return the proper 413 status code instead of a generic 500.
  if (err.type === "entity.too.large") {
    res.status(413).json({ error: "Request payload too large" });
    return;
  }

  // Body parser: malformed JSON.
  if (err.type === "entity.parse.failed") {
    res.status(400).json({ error: "Malformed JSON in request body" });
    return;
  }

  // Generic Error with a status code attached (some libraries set this).
  const status = err.status ?? err.statusCode;
  if (typeof status === "number" && status >= 400 && status < 600) {
    res.status(status).json({ error: err.message || "Request failed" });
    return;
  }

  // Anything else is a true "we don't know what happened" error.
  // Log full details server-side, return generic 500 to client.
  // NEVER leak stack traces or internal details to the browser.
  const isProduction = env.NODE_ENV === "production";
  res.status(500).json({
    error: "Internal server error",
    ...(isProduction ? {} : { message: err.message }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
  });
}