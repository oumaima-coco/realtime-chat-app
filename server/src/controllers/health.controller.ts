// Controllers are functions that handle a request and produce a response.
// They sit at the "end of the line" — by the time a controller runs,
// all the middleware (logging, auth checks, validation, etc.) has already
// passed the request through.
//
// Convention: one controller function per endpoint. Filename pattern:
// <resource>.controller.ts (e.g., health.controller.ts, auth.controller.ts).

import type { Request, Response } from "express";

// GET /health
// Returns a small JSON object so monitoring tools can verify the server
// is responsive. We include the current uptime — a useful debugging metric
// when chasing crashes.
export function getHealth(req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
  //  ^ res.status(200) sets the HTTP status code (200 = "OK, success").
  //    res.json(obj) serializes the object to JSON and sends it as the
  //    response body, along with the right Content-Type header.
  //
  //  process.uptime() returns how long the Node process has been running,
  //  in seconds (with fractional precision). We floor it for cleaner output.
}