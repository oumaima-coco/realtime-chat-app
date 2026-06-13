// PostgreSQL connection pool.

import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

// Build the pool config based on which database format we have.
// In production (DATABASE_URL set), we use connectionString.
// In development (individual fields), we use the structured config.
//
// SSL handling: cloud Postgres providers require SSL connections, but
// their certificates often aren't signed by a standard CA. The
// `rejectUnauthorized: false` setting accepts self-signed/unknown certs,
// which is safe for application-level connections (the network is still
// encrypted; we just don't verify the certificate chain).
function buildPoolConfig() {
  const db = env.DATABASE;

  // Common settings for both modes.
  const common = {
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };

  if ("URL" in db) {
    // Production / cloud mode — single connection string.
    return {
      connectionString: db.URL,
      ssl: { rejectUnauthorized: false },
      ...common,
    };
  }

  // Local dev mode — individual fields, no SSL.
  return {
    host: db.HOST,
    port: db.PORT,
    database: db.NAME,
    user: db.USER,
    password: db.PASSWORD,
    ...common,
  };
}

export const pool = new Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("Unexpected error on idle database client:", err);
});

export async function verifyDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT NOW() as now");
    console.log(`✓ Database connected — server time: ${result.rows[0].now}`);
  } finally {
    client.release();
  }
}