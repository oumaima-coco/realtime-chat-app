// Migration runner.
//
// Reads every .sql file in src/db/migrations/, sorted by filename, and
// runs the ones that haven't been applied yet. A small table called
// `_migrations` tracks which files have been run.
//
// Run with: npm run migrate

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

// ES Modules quirk: there's no __dirname like in CommonJS. This is the
// standard workaround to get the directory of the current file.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function runMigrations(): Promise<void> {
  // Step 1: ensure the tracking table exists. IF NOT EXISTS makes this
  // idempotent — safe to run repeatedly. The tracking table is technically
  // a migration itself, but we bootstrap it manually since we need it
  // before we can record any migration was run.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename    VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Step 2: find every .sql file in the migrations folder, sorted by name.
  // Numerical prefixes (001_, 002_, ...) ensure lexicographic sort matches
  // intended execution order.
  const allFiles = await fs.readdir(MIGRATIONS_DIR);
  const sqlFiles = allFiles.filter((f) => f.endsWith(".sql")).sort();

  // Step 3: read which files have already been applied.
  const appliedResult = await pool.query<{ filename: string }>(
    "SELECT filename FROM _migrations",
  );
  const appliedSet = new Set(appliedResult.rows.map((r) => r.filename));

  // Step 4: run each unapplied migration in a transaction.
  // A "transaction" wraps multiple SQL statements so they all succeed
  // or all fail together — Postgres's ACID guarantee.
  let appliedCount = 0;
  for (const file of sqlFiles) {
    if (appliedSet.has(file)) {
      console.log(`  ✓ ${file} (already applied)`);
      continue;
    }

    const sqlPath = path.join(MIGRATIONS_DIR, file);
    const sql = await fs.readFile(sqlPath, "utf-8");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");                       // Start transaction.
      await client.query(sql);                           // Run the migration SQL.
      await client.query(
        "INSERT INTO _migrations (filename) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");                      // Persist on success.
      console.log(`  ✓ ${file} (applied)`);
      appliedCount++;
    } catch (err) {
      await client.query("ROLLBACK");                    // Undo on failure.
      console.error(`  ✗ ${file} FAILED:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log(
    `\nMigrations complete. ${appliedCount} new, ${sqlFiles.length - appliedCount} already applied.`,
  );
}

// Execute and exit. We close the pool explicitly so the Node process
// can exit cleanly instead of hanging on an open connection.
runMigrations()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Migration failed:", err);
    pool.end();
    process.exit(1);
  });