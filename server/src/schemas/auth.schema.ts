// Zod schemas for auth endpoints.
//
// Zod is a runtime validation library. TypeScript types are erased at
// compile time — they don't actually check incoming data. Zod schemas
// DO check at runtime: every request body that comes in gets validated
// against a schema before any business logic runs.
//
// The flow: schema.parse(req.body)
//   - If valid: returns a typed, sanitized object.
//   - If invalid: throws a ZodError with detailed information about
//     which fields failed and why.

import { z } from "zod";

// Schema for the body of POST /auth/register and POST /auth/login.
// Both endpoints accept the same shape: { username, password }.
export const credentialsSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    // Regex: only letters, numbers, underscores, hyphens.
    // No spaces, no special characters. Prevents weird usernames
    // like "   " or "../../etc" that could cause display or routing issues.
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens",
    ),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
    // We don't enforce complexity rules (uppercase, digits, etc.).
    // Modern security thinking (NIST guidelines) says length matters
    // more than complexity. "correct horse battery staple" is stronger
    // than "P@ss1!" despite looking less "secure."
});

// Zod can infer a TypeScript type from a schema. This gives us compile-time
// safety AND runtime validation from a single definition — no risk of the
// type and the validator drifting out of sync.
export type CredentialsInput = z.infer<typeof credentialsSchema>;