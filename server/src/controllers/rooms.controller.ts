import type { Request, Response } from "express";
import { z } from "zod";
import { createRoomSchema } from "../schemas/rooms.schema.js";
import {
  createRoom,
  listRooms,
  joinRoom,
  leaveRoom,
  RoomError,
} from "../services/rooms.service.js";

// POST /rooms — create a new room.
// requireAuth middleware guarantees req.user is set when this runs.
export async function postCreateRoom(req: Request, res: Response): Promise<void> {
  try {
    const { name } = createRoomSchema.parse(req.body);
    const room = await createRoom(name, req.user!.id);
    res.status(201).json({ room });
  } catch (err) {
    handleRoomError(err, res);
  }
}

// GET /rooms — list all rooms, annotated with membership status.
export async function getRooms(req: Request, res: Response): Promise<void> {
  try {
    const rooms = await listRooms(req.user!.id);
    res.status(200).json({ rooms });
  } catch (err) {
    handleRoomError(err, res);
  }
}

// POST /rooms/:id/join — add the current user to a room.
export async function postJoinRoom(req: Request, res: Response): Promise<void> {
  try {
    await joinRoom(req.params.id, req.user!.id);
    res.status(204).send();
    // 204 No Content — the operation succeeded; nothing to return.
  } catch (err) {
    handleRoomError(err, res);
  }
}

// POST /rooms/:id/leave — remove the current user from a room.
export async function postLeaveRoom(req: Request, res: Response): Promise<void> {
  try {
    await leaveRoom(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    handleRoomError(err, res);
  }
}

// Centralized error mapper — same shape as the auth controller's.
function handleRoomError(err: unknown, res: Response): void {
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: "Invalid input",
      details: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
    return;
  }
  if (err instanceof RoomError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Unexpected room error:", err);
  res.status(500).json({ error: "Internal server error" });
}