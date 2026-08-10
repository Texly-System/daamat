import type { Pool, PoolClient } from "@damatjs/deps/pg";
import { listWorkers, registerWorker, stopWorker } from "@damatjs/durability";
import { LEGACY_MIGRATIONS, PRODUCTION_RELATIONS } from "./legacy-upgrade.catalog";
import { seedLegacyRows } from "./legacy-upgrade.seed";

const tracker = `
CREATE TABLE "public"."_damat_migration_logs" (
  "id" TEXT PRIMARY KEY,
  "module" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "applied_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "reverted_at" TIMESTAMPTZ,
  "execution_time_ms" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'applied',
  UNIQUE ("module", "name")
)`;

export async function resetUpgradeDatabase(pool: Pool): Promise<void> {
  await pool.query('DROP SCHEMA IF EXISTS "damat" CASCADE');
  const tables = ["_damat_migration_logs", ...PRODUCTION_RELATIONS];
  for (const table of tables)
    await pool.query(`DROP TABLE IF EXISTS "public"."${table}" CASCADE`);
}

export async function seedLegacyDatabase(pool: Pool): Promise<void> {
  await resetUpgradeDatabase(pool);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(tracker);
    await client.query('SET LOCAL search_path TO "public"');
    for (const migration of LEGACY_MIGRATIONS) {
      await client.query(migration.sql);
      await client.query(
        `INSERT INTO "public"."_damat_migration_logs"
         ("id","module","name") VALUES ($1,$2,$3)`,
        [`${migration.owner}_${migration.id}`, migration.owner, migration.id],
      );
    }
    await seedLegacyRows(client);
    await client.query(
      'GRANT SELECT ON TABLE "public"."_damat_job_runs" TO PUBLIC',
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function withPublicSearchPath<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query('SET LOCAL search_path TO "public"');
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original runtime failure.
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function exercisePublicOnlyRuntime(pool: Pool): Promise<number> {
  const identity = await withPublicSearchPath(pool, (client) =>
    client.query<{ id: string }>(
      `INSERT INTO "damat"."_damat_work_control_activity"
       ("work_kind","scope","action") VALUES ('job','post','paused')
       RETURNING "id"`,
    ),
  );
  await withPublicSearchPath(pool, async (client) => {
    const id = `upgrade-worker-${crypto.randomUUID()}`;
    await registerWorker({
      id,
      capabilities: ["jobs"],
      hostname: "legacy-upgrade",
      processId: 1,
      concurrency: 1,
      executor: client,
    });
    const workers = await listWorkers({ executor: client, ids: [id] });
    if (workers[0]?.id !== id) throw new Error("qualified worker read failed");
    await stopWorker({ id, executor: client });
  });
  return Number(identity.rows[0]?.id ?? 0);
}
