import { describe, expect, it } from "bun:test";

import { MigrationTracker } from "../tracker";
import { makeFakePool, norm } from "./tracker.test.fixture";

describe("MigrationTracker.ensureTable — auto-create idempotency", () => {
  it("emits CREATE TABLE IF NOT EXISTS plus IF NOT EXISTS indexes (safe to re-run)", async () => {
    const { pool, queries } = makeFakePool();
    const tracker = new MigrationTracker(pool);
    await tracker.ensureTable();
    await tracker.ensureTable();

    expect(queries).toHaveLength(2);
    for (const query of queries) {
      const sql = norm(query.sql);
      expect(sql).toContain(
        'CREATE TABLE IF NOT EXISTS "damat"."_damat_migration_logs"',
      );
      expect(sql).toContain('CREATE SCHEMA "damat"');
      expect(sql).toContain(
        'CREATE INDEX IF NOT EXISTS "idx__damat_migration_logs_module"',
      );
      expect(sql).toContain(
        'CREATE INDEX IF NOT EXISTS "idx__damat_migration_logs_status"',
      );
      expect(sql).toContain("\"status\" TEXT NOT NULL DEFAULT 'applied'");
    }
    expect(queries[0]!.sql).toBe(queries[1]!.sql);
  });
});
