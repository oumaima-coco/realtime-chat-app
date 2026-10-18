import type { Request, Response } from "express";
import { getMessagesForRoom } from "../services/messages.service.js";
import { isUserInRoom } from "../services/rooms.service.js";

export async function getRoomMessages(req: Request, res: Response): Promise<void> {
  try {
    const roomId = String(req.params.id);
    const userId = req.user!.id;

    const isMember = await isUserInRoom(roomId, userId);
    if (!isMember) {
      res.status(403).json({ error: "Not a member of this room" });
      return;
    }

    const before = typeof req.query.before === "string" ? req.query.before : undefined;
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;

    const result = await getMessagesForRoom(roomId, { before, limit });
    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to get room messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}