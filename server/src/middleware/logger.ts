// A simple request logger middleware.
//
// Middleware in Express is just a function with a specific signature:
//   (request, response, next) => void
//
// Express calls this function for every incoming request that matches the
// path it's registered on. Inside the function we can:
//   - Inspect the request (URL, method, headers, body)
//   - Modify the response
//   - Block the request (by sending a response and NOT calling next())
//   - Pass the request along to the next middleware (by calling next())
//
// The "next" function is the chain link — calling it hands off to the
// next middleware in the line. Forgetting to call it is the #1 Express
// beginner bug: your server will just hang because the request never
// reaches a handler.

import type { Request, Response, NextFunction } from "express";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = Date.now();

  // IMPORTANT: use req.originalUrl, not req.url.
  //
  // Express has two URL properties:
  //   - req.url:         relative to the current router. Gets rewritten
  //                      when the request enters a sub-router (e.g.,
  //                      "/health" becomes "/" inside the /health router).
  //   - req.originalUrl: the original, unchanged URL the client requested.
  //                      Stays "/health" no matter how the routers process it.
  //
  // For logging, we want originalUrl — otherwise the response log line
  // shows the router-relative path, not what the client actually asked for.
  console.log(`→ ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(
      `← ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`,
    );
  });

  next();
}