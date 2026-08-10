import { expect, test } from "bun:test";
import { Pool } from "@damatjs/deps/pg";
import { relocateDamatRelations } from "../src";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

test("an unrelated relation makes an existing damat schema incompatible", async () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query('CREATE SCHEMA IF NOT EXISTS "damat"');
    await client.query('CREATE TABLE "damat"."application_owned" (id TEXT)');
    await expect(
      client.query(relocateDamatRelations(["_damat_workers"])),
    ).rejects.toThrow(/non-Damat relation.*application_owned.*move or rename/i);
  } finally {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});
