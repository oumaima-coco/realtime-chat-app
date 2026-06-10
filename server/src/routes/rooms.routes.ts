import { Router } from "express";
import {
  postCreateRoom,
  getRooms,
  postJoinRoom,
  postLeaveRoom,
} from "../controllers/rooms.controller.js";
import { getRoomMessages } from "../controllers/messages.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/",                postCreateRoom);
router.get("/",                 getRooms);
router.post("/:id/join",        postJoinRoom);
router.post("/:id/leave",       postLeaveRoom);
router.get("/:id/messages",     getRoomMessages);

export default router;