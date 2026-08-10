import type { Pool } from "@damatjs/deps/pg";
import { ALL_RELATIONS, PRODUCTION_RELATIONS } from "./legacy-upgrade.catalog";

export async function relationLocations(pool: Pool) {
  const locations = [] as Array<{
    name: string;
    source: string | null;
    target: string | null;
  }>;
  for (const name of ALL_RELATIONS) {
    const result = await pool.query<{ source: string | null; target: string | null }>(
      `SELECT to_regclass('public.${name}') AS source,
              to_regclass('damat.${name}') AS target`,
    );
    locations.push({ name, ...result.rows[0] });
  }
  return locations;
}

export async function relationCounts(pool: Pool): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const relation of PRODUCTION_RELATIONS) {
    const result = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM "damat"."${relation}"`,
    );
    counts[relation] = Number(result.rows[0]?.count ?? 0);
  }
  return counts;
}

export async function trackerRows(pool: Pool) {
  return (
    await pool.query<{ id: string; module: string; name: string; status: string }>(
      `SELECT "id","module","name","status"
         FROM "damat"."_damat_migration_logs"
        ORDER BY "module","name"`,
    )
  ).rows;
}

export async function preservedPayloads(pool: Pool) {
  const job = await pool.query<{ name: string; payload: Record<string, unknown> }>(
    `SELECT "name","payload" FROM "damat"."_damat_job_runs"`,
  );
  const event = await pool.query<{ name: string; payload: Record<string, unknown> }>(
    `SELECT "name","payload" FROM "damat"."_damat_event_outbox"`,
  );
  const pipeline = await pool.query<{ name: string; input: Record<string, unknown> }>(
    `SELECT d."name", r."input"
       FROM "damat"."_damat_pipeline_runs" r
       JOIN "damat"."_damat_pipeline_definitions" d ON d."id" = r."definition_id"`,
  );
  return {
    job: job.rows[0],
    event: event.rows[0],
    pipeline: pipeline.rows[0],
  };
}

export async function preservedConstraints(pool: Pool) {
  return (
    await pool.query<{ conname: string; relation: string; referenced: string | null }>(
      `SELECT conname, conrelid::regclass::text AS relation,
              confrelid::regclass::text AS referenced
         FROM pg_constraint
        WHERE conname IN (
          '_damat_job_attempts_run_fkey',
          '_damat_event_deliveries_event_fkey',
          '_damat_pipeline_node_executions_job_fkey')`,
    )
  ).rows;
}

export async function preservedIndexes(pool: Pool) {
  return (
    await pool.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes
        WHERE schemaname = 'damat' AND indexname IN (
          '_damat_job_runs_name_idx', '_damat_event_outbox_name_idx',
          '_damat_pipeline_runs_status_idx', 'idx__damat_migration_logs_module')`,
    )
  ).rows.map(({ indexname }) => indexname);
}

export async function jobRunsAcl(pool: Pool): Promise<string> {
  const result = await pool.query<{ acl: string | null }>(
    `SELECT relacl::text AS acl FROM pg_class
      WHERE oid = 'damat._damat_job_runs'::regclass`,
  );
  return result.rows[0]?.acl ?? "";
}
