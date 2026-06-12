import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

// Stricter rate limiting on /register and /login — these are the
// brute-force targets. 5 failed attempts per 15 minutes per IP.
router.post("/register", authRateLimiter, register);
router.post("/login",    authRateLimiter, login);

// /me doesn't need extra rate limiting; the apiRateLimiter at the app
// level (100/min) is plenty since the token check is cheap.
router.get("/me", requireAuth, getMe);

export default router;