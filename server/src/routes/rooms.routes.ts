import { Router } from "express";
import {
  postCreateRoom,
  getRooms,
  postJoinRoom,
  postLeaveRoom,
} from "../controllers/rooms.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// All room endpoints require authentication.
// Mounting requireAuth at the top of the router applies it to every
// route below this line — much cleaner than repeating it on each route.
router.use(requireAuth);

router.post("/",          postCreateRoom);
router.get("/",           getRooms);
router.post("/:id/join",  postJoinRoom);
router.post("/:id/leave", postLeaveRoom);

export default router;