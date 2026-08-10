import { expect, test } from "bun:test";
import { findPipelineRun } from "../../src/repositories/runs";
import { ensureStorage, pool } from "./context";

const relations = [
  "_damat_idempotency_keys",
  "_damat_workers",
  "_damat_work_controls",
  "_damat_work_control_activity",
  "_damat_maintenance_activity",
  "_damat_acceleration_outbox",
  "_damat_acceleration_state",
  "_damat_retention_overrides",
  "_damat_job_runs",
  "_damat_job_attempts",
  "_damat_job_activity",
  "_damat_job_logs",
  "_damat_job_schedules",
  "_damat_job_schedule_activity",
  "_damat_job_deduplication",
  "_damat_event_outbox",
  "_damat_event_deliveries",
  "_damat_event_delivery_attempts",
  "_damat_event_activity",
  "_damat_event_logs",
  "_damat_pipeline_definitions",
  "_damat_pipeline_versions",
  "_damat_pipeline_drafts",
  "_damat_pipeline_layouts",
  "_damat_pipeline_runs",
  "_damat_pipeline_node_executions",
  "_damat_pipeline_transitions",
  "_damat_pipeline_signals",
  "_damat_pipeline_trigger_receipts",
  "_damat_pipeline_schedules",
  "_damat_pipeline_trigger_controls",
  "_damat_pipeline_activity",
];

test("fresh full catalog keeps every infrastructure relation out of public", async () => {
  await ensureStorage();
  const result = await pool.query<{
    name: string;
    source: string | null;
    target: string | null;
  }>(
    `SELECT name, to_regclass('public.' || name) AS source,
            to_regclass('damat.' || name) AS target
       FROM unnest($1::text[]) AS name ORDER BY name`,
    [relations],
  );
  expect(result.rows).toHaveLength(relations.length);
  expect(result.rows.every(({ source }) => source === null)).toBe(true);
  expect(result.rows.every(({ target }) => target !== null)).toBe(true);
});

test("pipeline runtime reads work with a public-only search path", async () => {
  await ensureStorage();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query('SET LOCAL search_path TO "public"');
    await expect(
      findPipelineRun(crypto.randomUUID(), client),
    ).resolves.toBeUndefined();
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});
