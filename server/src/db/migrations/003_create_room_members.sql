-- Migration 003: Create the room_members "junction table".
-- A junction table expresses many-to-many relationships:
-- a user can be in many rooms; a room can have many users.

CREATE TABLE room_members (
  -- ON DELETE CASCADE = if a room or user is deleted, all related
  -- membership rows are deleted automatically.
  room_id     BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Composite primary key: (room_id, user_id) together must be unique.
  -- This means the same user can't be added to the same room twice.
  PRIMARY KEY (room_id, user_id)
);

-- Index for "what rooms is this user in?" lookups, which we'll do often.
CREATE INDEX room_members_user_id_idx ON room_members (user_id);