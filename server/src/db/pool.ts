// PostgreSQL connection pool.
//
// A "pool" is a small set of pre-opened database connections that the app
// shares across all requests. Opening a new connection per request would be
// slow (~10-50ms each); reusing a handful of long-lived connections is
// dramatically faster.
//
// The pg library handles all the pooling logic. We just configure it and
// export the pool object. Anywhere else in the app that needs to query the
// database imports `pool` from here.

import pg from "pg";
import { env } from "../config/env.js";

// Why the weird import? pg is a CommonJS module published before ES Modules
// were standard, so we have to import the whole module and destructure Pool
// from it. This pattern shows up often when using older Node libraries with
// modern TypeScript.
const { Pool } = pg;

export const pool = new Pool({
  host: env.DATABASE.HOST,
  port: env.DATABASE.PORT,
  database: env.DATABASE.NAME,
  user: env.DATABASE.USER,
  password: env.DATABASE.PASSWORD,

  // Pool tuning. Sane defaults for development.
  // In production, you'd tune them based on observed load.
  max: 10,                          // Maximum number of connections in the pool.
  idleTimeoutMillis: 30_000,        // Close idle connections after 30 seconds.
  connectionTimeoutMillis: 5_000,   // Fail if a connection takes > 5 seconds to open.
});

// Log a message when the pool errors out (rare but useful for debugging
// dropped connections, network issues, or Postgres being down).
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client:", err);
});

// A small helper to confirm the database is reachable on startup.
// We export this so the server entry point can call it and crash fast
// if Postgres isn't running — way better than a confusing crash later
// when the first real query comes in.
export async function verifyDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    // SELECT NOW() asks Postgres for its current time. It's the canonical
    // "are you alive?" query — minimal, harmless, always works if the
    // connection is healthy.
    const result = await client.query("SELECT NOW() as now");
    console.log(`✓ Database connected — server time: ${result.rows[0].now}`);
  } finally {
    // ALWAYS release the connection back to the pool, even if the query
    // throws. Forgetting this is the database equivalent of forgetting
    // next() — pool exhaustion bugs are very painful to debug.
    client.release();
  }
}