-- Migration 001: Create the users table.
-- Each row represents one registered user account.

CREATE TABLE users (
  -- Unique numeric identifier. BIGSERIAL = 64-bit auto-incrementing integer.
  -- PRIMARY KEY means: this column uniquely identifies each row, and the
  -- database enforces that uniqueness automatically.
  id              BIGSERIAL PRIMARY KEY,

  -- The user's chosen username. UNIQUE prevents duplicates.
  -- NOT NULL means the database refuses an insert with no value here.
  -- VARCHAR(32) = up to 32 characters.
  username        VARCHAR(32) UNIQUE NOT NULL,

  -- Password is stored as a bcrypt hash, never plain text.
  -- bcrypt hashes are exactly 60 characters long.
  password_hash   VARCHAR(60) NOT NULL,

  -- TIMESTAMPTZ = "timestamp with time zone" — always prefer this over
  -- plain TIMESTAMP. Stores everything in UTC and converts on display.
  -- DEFAULT NOW() means: if no value is given on insert, use the current time.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- An index on lowercase(username) makes login lookups fast and case-insensitive.
-- Without an index, looking up a username = scanning every row. With one = O(log n).
CREATE UNIQUE INDEX users_username_lower_idx ON users (LOWER(username));