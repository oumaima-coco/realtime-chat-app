// Rate limiting middleware.
//
// Different endpoints get different limits based on their threat model:
//   - Auth endpoints (login, register): strict — these are brute-force targets
//   - Read endpoints (list rooms, get messages): lenient — normal browsing
//   - Write endpoints (create room): moderate
//
// All limits are PER IP. Multi-server deployments would use Redis to share
// counters; for our single-server setup, in-memory counters are fine.

import rateLimit from "express-rate-limit";

// Strict limiter for authentication endpoints.
// 5 attempts per 15 minutes per IP = enough for honest typos, far too
// few for brute-force attempts at thousands of guesses per minute.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window per IP
  message: {
    error: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  // Return 429 Too Many Requests instead of allowing the request through.
  standardHeaders: true,
  // Add the standard Retry-After header so clients know when to retry.
  legacyHeaders: false,
  // Skip successful logins — we only count failed attempts, so legitimate
  // users who log in successfully aren't punished by the limit.
  skipSuccessfulRequests: true,
});

// Lenient limiter for general API access.
// 100 requests per minute per IP = generous for normal app usage,
// catches abusive scraping or buggy clients in an infinite loop.
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,
  message: {
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate limiter for write endpoints (room creation, etc).
// 20 writes per minute. Higher than typical normal usage but blocks abuse.
export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});