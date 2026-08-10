import { expect, test } from "bun:test";
import { jobsSystemMigrations } from "../../src/migrations/catalog";
import { ensureStorage, pool } from "./context";

test("jobs catalog has stable migration ownership and order", () => {
  expect(jobsSystemMigrations.owner).toBe("@damatjs/jobs");
  expect(
    jobsSystemMigrations.migrations.map(({ id, order }) => [id, order]),
  ).toEqual([
    ["001", 300],
    ["002", 400],
    ["003", 450],
    ["004", 490],
    ["005", 1210],
  ]);
});

test("jobs migrations create every persistence table", async () => {
  await ensureStorage();
  const names = [
    "damat._damat_job_runs",
    "damat._damat_job_attempts",
    "damat._damat_job_activity",
    "damat._damat_job_logs",
    "damat._damat_job_schedules",
    "damat._damat_job_schedule_activity",
    "damat._damat_job_deduplication",
  ];
  const result = await pool.query<{ name: string | null }>(
    "SELECT to_regclass(value) AS name FROM unnest($1::text[]) value",
    [names],
  );
  expect(result.rows.map(({ name }) => name)).toEqual(names);
});

test("jobs schema enforces lifecycle and due-work invariants", async () => {
  await ensureStorage();
  const constraints = await pool.query<{ conname: string }>(
    `SELECT c.conname FROM pg_constraint c
     JOIN pg_namespace n ON n.oid=c.connamespace
     WHERE n.nspname='damat' AND (c.conname LIKE '_damat_job_%_check'
        OR c.conname = '_damat_job_deduplication_pkey')`,
  );
  const indexes = await pool.query<{ indexname: string }>(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname = 'damat'
       AND indexname IN (
         '_damat_job_runs_due_idx',
         '_damat_job_schedule_due_idx',
         '_damat_job_schedule_occurrence_uidx'
       )`,
  );
  expect(constraints.rows.length).toBeGreaterThanOrEqual(8);
  expect(indexes.rows.map(({ indexname }) => indexname).sort()).toEqual([
    "_damat_job_runs_due_idx",
    "_damat_job_schedule_due_idx",
    "_damat_job_schedule_occurrence_uidx",
  ]);
});

test("jobs relocation migration qualifies its catalog", () => {
  const migration = jobsSystemMigrations.migrations.find(({ id }) => id === "005");
  expect(migration?.sql).toContain('CREATE SCHEMA "damat"');
  expect(migration?.sql).toContain('"_damat_job_runs"');
  expect(migration?.sql).toContain('ALTER TABLE "public"."_damat_job_runs"');
});
