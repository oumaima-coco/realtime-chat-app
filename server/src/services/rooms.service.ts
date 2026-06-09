// Rooms service — database operations for chat rooms.
//
// Three-layer pattern (same as auth):
//   route → controller → service (this file) → database
//
// Service functions don't know about HTTP. They take inputs, do DB work,
// return outputs (or throw). The controller handles HTTP concerns.

import { pool } from "../db/pool.js";

// Shape of a room row as stored in the database.
interface RoomRow {
  id: string;
  name: string;
  created_by: string | null;
  created_at: Date;
}

// Public shape exposed to clients. camelCase web convention.
// Includes "isMember" — whether the calling user is in the room.
// Computed per-request so the same room can show as "joined" for one
// user and "not joined" for another in the same response.
export interface PublicRoom {
  id: string;
  name: string;
  createdBy: string | null;
  createdAt: Date;
  memberCount: number;
  isMember: boolean;
}

// Custom error class — same pattern as AuthError. Lets controllers
// turn business errors into proper HTTP status codes.
export class RoomError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "RoomError";
  }
}

// Helper: detect Postgres errors by their code property.
function isPostgresError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

// ---- Service functions ----

// Create a room AND auto-add the creator as the first member.
// We do both in a transaction so they succeed-or-fail together.
export async function createRoom(name: string, creatorId: string): Promise<PublicRoom> {
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 64) {
    throw new RoomError("Room name must be 2-64 characters", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert the room.
    const roomResult = await client.query<RoomRow>(
      `INSERT INTO rooms (name, created_by) VALUES ($1, $2)
       RETURNING id, name, created_by, created_at`,
      [trimmedName, creatorId],
    );
    const room = roomResult.rows[0];

    // Auto-join the creator. Without this, the user would create a room
    // and immediately be locked out of it — bad UX.
    await client.query(
      `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)`,
      [room.id, creatorId],
    );

    await client.query("COMMIT");

    return {
      id: room.id,
      name: room.name,
      createdBy: room.created_by,
      createdAt: room.created_at,
      memberCount: 1,
      isMember: true,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// List all rooms, annotated with whether the requesting user is a member
// and how many total members each room has.
//
// This is a more complex query — it JOINs the rooms table with
// room_members. The LEFT JOIN preserves rooms with zero members.
export async function listRooms(userId: string): Promise<PublicRoom[]> {
  const result = await pool.query<{
    id: string;
    name: string;
    created_by: string | null;
    created_at: Date;
    member_count: string;       // COUNT returns string in pg (big number safety)
    is_member: boolean;
  }>(
    `SELECT
       r.id,
       r.name,
       r.created_by,
       r.created_at,
       COUNT(rm_all.user_id) AS member_count,
       BOOL_OR(rm_me.user_id IS NOT NULL) AS is_member
     FROM rooms r
     LEFT JOIN room_members rm_all ON rm_all.room_id = r.id
     LEFT JOIN room_members rm_me  ON rm_me.room_id = r.id AND rm_me.user_id = $1
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at,
    memberCount: Number(row.member_count),
    isMember: Boolean(row.is_member),
  }));
}

// Add the user as a member of an existing room.
// Idempotent — joining a room you're already in is a no-op (not an error).
export async function joinRoom(roomId: string, userId: string): Promise<void> {
  // Check the room exists first. Without this, we'd get a foreign-key error
  // with a less helpful message.
  const roomCheck = await pool.query("SELECT id FROM rooms WHERE id = $1", [roomId]);
  if (roomCheck.rows.length === 0) {
    throw new RoomError("Room not found", 404);
  }

  try {
    await pool.query(
      `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)`,
      [roomId, userId],
    );
  } catch (err) {
    // Code 23505 = unique violation. Means the user is already a member.
    // We treat this as success (idempotent) instead of an error.
    if (isPostgresError(err) && err.code === "23505") {
      return;
    }
    throw err;
  }
}

// Remove the user from a room. Idempotent — leaving a room you're not in
// is a no-op.
export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  await pool.query(
    `DELETE FROM room_members WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId],
  );
}

// Check whether a user is a member of a room.
// Used by the socket handlers to verify the user can send messages to a
// room before broadcasting them.
export async function isUserInRoom(roomId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId],
  );
  return result.rows.length > 0;
}