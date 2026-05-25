-- Migration 004: Create the messages table.
-- This will be the largest table in any active chat app, so indexing matters.

CREATE TABLE messages (
  id          BIGSERIAL PRIMARY KEY,
  room_id     BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,

  -- ON DELETE SET NULL preserves the message history even if the sender's
  -- account is later deleted (their messages would show as "[deleted user]").
  sender_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,

  -- TEXT = unbounded string, preferable to VARCHAR(n) when there's no
  -- clear length limit. Postgres handles long text efficiently.
  content     TEXT NOT NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index optimized for "give me the last N messages in room X" —
-- our most common query pattern.
CREATE INDEX messages_room_created_idx ON messages (room_id, created_at DESC);