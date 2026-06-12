import { Router } from "express";
import {
  postCreateRoom,
  getRooms,
  postJoinRoom,
  postLeaveRoom,
} from "../controllers/rooms.controller.js";
import { getRoomMessages } from "../controllers/messages.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { writeRateLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.use(requireAuth);

// Create room and join/leave are "write" operations — moderate limiting.
router.post("/",                writeRateLimiter, postCreateRoom);
router.post("/:id/join",        writeRateLimiter, postJoinRoom);
router.post("/:id/leave",       writeRateLimiter, postLeaveRoom);

// Reads use the default apiRateLimiter from app level — 100/min is fine.
router.get("/",                 getRooms);
router.get("/:id/messages",     getRoomMessages);

export default router;