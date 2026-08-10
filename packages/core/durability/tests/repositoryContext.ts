import { Pool } from "@damatjs/deps/pg";
import {
  createDurabilityClient,
  damatRelation,
  durabilitySystemMigrations,
} from "../src";

export const databaseUrl = process.env.DATABASE_URL;

export async function createRepositoryContext() {
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString: databaseUrl });
  await ensureMigrations(pool);
  return { pool, durability: createDurabilityClient({ pool }) };
}

export function testId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function ensureMigrations(pool: Pool): Promise<void> {
  const client = await pool.connect();
  const tableByMigration: Record<string, string> = {
    "001": "_damat_idempotency_keys",
    "002": "_damat_work_controls",
    "003": "_damat_acceleration_outbox",
    "004": "_damat_retention_overrides",
    "005": "_damat_idempotency_keys",
    "006": "_damat_idempotency_keys",
  };
  try {
    await client.query("SELECT pg_advisory_lock(724034)");
    await client.query('SET search_path TO "public", "damat"');
    for (const migration of durabilitySystemMigrations.migrations) {
      const table = tableByMigration[migration.id];
      const existing = await client.query(
        "SELECT COALESCE(to_regclass($1), to_regclass($2)) AS name",
        [damatRelation(table), `public.${table}`],
      );
      let needsRefresh = migration.id === "006";
      if (migration.id === "004") {
        const constraint = await client.query(`
          SELECT pg_get_constraintdef(oid) AS definition
          FROM pg_constraint
          WHERE conname = '_damat_retention_overrides_kind_check'
        `);
        needsRefresh = !constraint.rows[0]?.definition?.includes("pipeline");
      }
      if (migration.id === "005") {
        const column = await client.query(`
          SELECT 1 FROM information_schema.columns
          WHERE table_name = '_damat_idempotency_keys'
            AND column_name = 'intent_fingerprint'
        `);
        needsRefresh = column.rowCount === 0;
      }
      if (!existing.rows[0]?.name || needsRefresh) {
        await client.query(migration.sql);
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(724034)");
    client.release();
  }
}
