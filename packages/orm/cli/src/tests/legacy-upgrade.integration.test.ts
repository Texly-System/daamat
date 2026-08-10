import { describe, expect, test } from "bun:test";
import { Pool } from "@damatjs/deps/pg";
import { runMigrations } from "@damatjs/orm-migration";
import {
  jobRunsAcl,
  preservedConstraints,
  preservedIndexes,
  preservedPayloads,
  relationCounts,
  relationLocations,
  trackerRows,
} from "./legacy-upgrade.assertions";
import {
  LEGACY_MIGRATIONS,
  PRODUCTION_RELATIONS,
  SYSTEM_MIGRATIONS,
} from "./legacy-upgrade.catalog";
import {
  resetUpgradeDatabase,
  exercisePublicOnlyRuntime,
  seedLegacyDatabase,
} from "./legacy-upgrade.setup";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("1.0.5 dedicated-schema upgrade", () => {
  test("moves populated legacy catalogs through the real ORM runner", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await seedLegacyDatabase(pool);
      expect(LEGACY_MIGRATIONS).toHaveLength(17);
      expect(SYSTEM_MIGRATIONS).toHaveLength(21);

      const first = await runMigrations(pool, {}, {
        systemMigrations: SYSTEM_MIGRATIONS,
      });
      expect(first.every((result) => result.success)).toBe(true);
      expect((await trackerRows(pool)).map(({ name }) => name)).toHaveLength(21);
      expect(await trackerRows(pool)).toContainEqual(expect.objectContaining({
        id: "@damatjs/durability_001",
        module: "@damatjs/durability",
        name: "001",
        status: "applied",
      }));

      const locations = await relationLocations(pool);
      expect(locations).toHaveLength(PRODUCTION_RELATIONS.length + 1);
      expect(locations.every(({ name, source, target }) =>
        source === null && target === `damat.${name}`)).toBe(true);

      const counts = await relationCounts(pool);
      expect(Object.values(counts).every((count) => count > 0)).toBe(true);
      expect(await preservedPayloads(pool)).toEqual({
        job: { name: "legacy-job", payload: {} },
        event: { name: "legacy.event", payload: {} },
        pipeline: { name: "legacy-pipeline", input: {} },
      });
      const constraints = await preservedConstraints(pool);
      expect(constraints).toEqual(expect.arrayContaining([
        expect.objectContaining({
          relation: "damat._damat_job_attempts",
          referenced: "damat._damat_job_runs",
        }),
        expect.objectContaining({
          relation: "damat._damat_event_deliveries",
          referenced: "damat._damat_event_outbox",
        }),
        expect.objectContaining({
          relation: "damat._damat_pipeline_node_executions",
          referenced: "damat._damat_job_runs",
        }),
      ]));
      expect(await preservedIndexes(pool)).toEqual(expect.arrayContaining([
        "_damat_job_runs_name_idx",
        "_damat_event_outbox_name_idx",
        "_damat_pipeline_runs_status_idx",
        "idx__damat_migration_logs_module",
      ]));
      expect(await jobRunsAcl(pool)).toMatch(/=r/);

      expect(await exercisePublicOnlyRuntime(pool)).toBeGreaterThan(1);

      const beforeRows = await trackerRows(pool);
      const beforeCounts = await relationCounts(pool);
      const second = await runMigrations(pool, {}, {
        systemMigrations: SYSTEM_MIGRATIONS,
      });
      expect(second.every((result) =>
        result.success && result.applied.length === 0 && result.pending.length === 0,
      )).toBe(true);
      expect(await trackerRows(pool)).toEqual(beforeRows);
      expect(await relationCounts(pool)).toEqual(beforeCounts);
    } finally {
      await resetUpgradeDatabase(pool);
      await pool.end();
    }
  }, 30_000);
});
