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
// "import type" tells TypeScript: I only need these for type-checking,
// don't include them in the compiled JS output. It's a small optimization
// but signals good TypeScript hygiene.

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Capture the time BEFORE the request is handled so we can compute
  // how long it took to respond. This is a classic web server logging pattern.
  const startTime = Date.now();

  // Log the incoming request immediately. We don't know the response status
  // yet — that's known only AFTER downstream middleware/handlers run.
  console.log(`→ ${req.method} ${req.url}`);

  // Express fires the "finish" event on the response object when it has
  // been fully sent back to the client. We hook into that to log the result.
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(
      `← ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`,
    );
  });

  // Hand off to the next middleware/route. WITHOUT this line, the request
  // never reaches the route handler — the server would hang forever.
  next();
}