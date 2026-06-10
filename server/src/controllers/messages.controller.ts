import type { Request, Response } from "express";
import { getMessagesForRoom } from "../services/messages.service.js";
import { isUserInRoom } from "../services/rooms.service.js";

// GET /rooms/:id/messages
// Returns a page of messages for the room.
// Query params:
//   ?before=<ISO timestamp> — load messages older than this point (cursor)
//   ?limit=<number>         — page size, default 50, max 100
export async function getRoomMessages(req: Request, res: Response): Promise<void> {
  try {
    const roomId = req.params.id;
    const userId = req.user!.id;

    // Authorization: only members of the room can read its history.
    const isMember = await isUserInRoom(roomId, userId);
    if (!isMember) {
      res.status(403).json({ error: "Not a member of this room" });
      return;
    }

    // Parse query string params. They're strings; we need to convert/validate.
    const before = typeof req.query.before === "string" ? req.query.before : undefined;
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;

    const result = await getMessagesForRoom(roomId, { before, limit });
    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to get room messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}