-- Migration 002: Create the rooms table.
-- Each row represents one chat room.

CREATE TABLE rooms (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(64) NOT NULL,

  -- The user who created this room. FOREIGN KEY = references the id column
  -- of users(). The database enforces referential integrity: you can't
  -- insert a room with a created_by that doesn't match an existing user id.
  --
  -- ON DELETE SET NULL = if the creator is deleted, the room remains but
  -- created_by becomes NULL. We choose this over CASCADE (which would
  -- delete the room) because losing chat history when a user leaves
  -- would be bad UX.
  created_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for sorting/listing rooms by creation time (newest first).
CREATE INDEX rooms_created_at_idx ON rooms (created_at DESC);