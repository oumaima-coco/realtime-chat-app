import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// ---- Public endpoints (no JWT required) ----
//
// These have to be public because the user doesn't have a token yet —
// they're calling these to obtain one.
router.post("/register", register);
router.post("/login", login);

// ---- Protected endpoint ----
//
// `requireAuth` runs BEFORE `getMe`. If the JWT is missing, invalid,
// or expired, the middleware sends 401 and getMe never runs.
//
// This pattern (middleware-before-controller) is exactly how we'll
// protect EVERY future endpoint that requires a logged-in user.
// Adding auth is one keyword.
router.get("/me", requireAuth, getMe);

export default router;