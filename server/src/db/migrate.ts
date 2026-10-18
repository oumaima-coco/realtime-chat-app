import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool.js";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename    VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const allFiles = await fs.readdir(MIGRATIONS_DIR);
  const sqlFiles = allFiles.filter((f) => f.endsWith(".sql")).sort();

  const appliedResult = await pool.query<{ filename: string }>(
    "SELECT filename FROM _migrations",
  );
  const appliedSet = new Set(appliedResult.rows.map((r) => r.filename));

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
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO _migrations (filename) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");
      console.log(`  ✓ ${file} (applied)`);
      appliedCount++;
    } catch (err) {
      await client.query("ROLLBACK");
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

runMigrations()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Migration failed:", err);
    pool.end();
    process.exit(1);
  });