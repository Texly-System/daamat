import { Pool, type PoolClient } from "@damatjs/deps/pg";
import {
  createDurabilityClient,
  durabilitySystemMigrations,
  setDurabilityClient,
  type SystemMigrationCatalog,
} from "@damatjs/durability";
import { jobsSystemMigrations } from "@damatjs/jobs/migrations";
import { eventsSystemMigrations } from "@damatjs/events/migrations";
import { pipelinesSystemMigrations } from "../../src/migrations";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
export const pool = new Pool({ connectionString: databaseUrl });
export const durability = createDurabilityClient({ pool });
setDurabilityClient(durability);
let ready: Promise<void> | undefined;

export const ensureStorage = () => (ready ??= migrate());
export const uniqueName = (prefix: string) =>
  `${prefix}-${crypto.randomUUID()}`;

async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(724038)");
    await client.query('CREATE SCHEMA IF NOT EXISTS "damat"');
    const catalogs: SystemMigrationCatalog[] = [
      durabilitySystemMigrations,
      jobsSystemMigrations,
      eventsSystemMigrations,
      pipelinesSystemMigrations,
    ];
    const migrations = catalogs
      .flatMap((catalog) => catalog.migrations)
      .sort((left, right) => left.order - right.order);
    for (const migration of migrations) {
      if (await applied(client, migration.owner, migration.id)) continue;
      await client.query("BEGIN");
      try {
        await client.query('SET LOCAL search_path TO "public", "damat"');
        await client.query(migration.sql);
        await tracker(client);
        await client.query(
          `INSERT INTO "damat"."_damat_system_migrations"
           ("owner","migration_id") VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [migration.owner, migration.id],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(724038)");
    client.release();
  }
}

async function applied(
  client: PoolClient,
  owner: string,
  id: string,
): Promise<boolean> {
  const legacy = await client
    .query(
      `SELECT 1 FROM "damat"."_damat_migration_logs"
     WHERE "module"=$1 AND "name"=$2 AND "status"='applied'`,
      [owner, id],
    )
    .catch(() => ({ rowCount: 0 }));
  if (legacy.rowCount) return true;
  const current = await client
    .query(
      `SELECT 1 FROM "damat"."_damat_system_migrations"
     WHERE "owner"=$1 AND "migration_id"=$2`,
      [owner, id],
    )
    .catch(() => ({ rowCount: 0 }));
  return Boolean(current.rowCount);
}

function tracker(client: PoolClient) {
  return client.query(`CREATE TABLE IF NOT EXISTS "damat"."_damat_system_migrations" (
    "owner" TEXT NOT NULL,"migration_id" TEXT NOT NULL,
    PRIMARY KEY ("owner","migration_id"))`);
}
