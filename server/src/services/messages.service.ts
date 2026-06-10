// Messages service — database operations for chat messages.

import { pool } from "../db/pool.js";

// Raw database row.
interface MessageRow {
  id: string;
  room_id: string;
  sender_id: string | null;
  sender_username: string | null;
  content: string;
  created_at: Date;
}

// Public shape exposed to clients. Matches the Socket.io ChatMessage shape
// so the frontend can interleave history and real-time messages seamlessly.
export interface PublicMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  createdAt: string;  // ISO string for JSON safety
}

// Convert internal DB row → public message shape.
// Note: sender_id can be NULL in the database if the user account was deleted
// (ON DELETE SET NULL from migration 004). We render those as "[deleted user]".
function toPublicMessage(row: MessageRow): PublicMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    senderId: row.sender_id ?? "0",
    senderUsername: row.sender_username ?? "[deleted user]",
    content: row.content,
    createdAt: row.created_at.toISOString(),
  };
}

// Save a new message to the database.
// Returns the full saved row so the caller can broadcast it with the
// database-generated id and exact timestamp.
export async function saveMessage(
  roomId: string,
  senderId: string,
  content: string,
): Promise<PublicMessage> {
  // INSERT ... RETURNING combined with a JOIN to fetch the sender's
  // username in one round-trip. Without this we'd need a second SELECT
  // query after the insert.
  const result = await pool.query<MessageRow>(
    `WITH inserted AS (
       INSERT INTO messages (room_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, room_id, sender_id, content, created_at
     )
     SELECT
       i.id,
       i.room_id,
       i.sender_id,
       u.username AS sender_username,
       i.content,
       i.created_at
     FROM inserted i
     LEFT JOIN users u ON u.id = i.sender_id`,
    [roomId, senderId, content],
  );

  return toPublicMessage(result.rows[0]);
}

// Load a page of messages for a room.
//
// Returns messages ordered oldest-first within the page (so the UI can
// render them top-to-bottom naturally). But under the hood we query
// newest-first (because the index is sorted that way) and then reverse
// at the end. The two-step is faster than ORDER BY created_at ASC LIMIT
// at large offsets.
//
// "cursor" pagination:
//   - First call: no cursor → returns the 50 NEWEST messages.
//   - Subsequent calls: pass the createdAt of the oldest message you have →
//     returns the 50 messages older than that.
export async function getMessagesForRoom(
  roomId: string,
  options: { before?: string; limit?: number } = {},
): Promise<{ messages: PublicMessage[]; hasMore: boolean }> {
  const limit = Math.min(options.limit ?? 50, 100);  // Cap at 100 to prevent abuse.
  const before = options.before;

  // Different SQL depending on whether we have a cursor.
  // We fetch limit+1 rows so we can tell if there are MORE messages beyond
  // this page (without doing a separate count query).
  const params: (string | number)[] = [roomId];
  let sql = `
    SELECT
      m.id,
      m.room_id,
      m.sender_id,
      u.username AS sender_username,
      m.content,
      m.created_at
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE m.room_id = $1
  `;

  if (before) {
    params.push(before);
    sql += ` AND m.created_at < $${params.length}`;
  }

  params.push(limit + 1);
  sql += ` ORDER BY m.created_at DESC LIMIT $${params.length}`;

  const result = await pool.query<MessageRow>(sql, params);

  // The limit+1 trick: if we got more rows than asked for, there are more
  // messages beyond this page.
  const hasMore = result.rows.length > limit;
  const trimmed = hasMore ? result.rows.slice(0, limit) : result.rows;

  // We queried newest-first, but the UI wants oldest-first for natural
  // chronological order. Reverse before returning.
  const messages = trimmed.reverse().map(toPublicMessage);

  return { messages, hasMore };
}