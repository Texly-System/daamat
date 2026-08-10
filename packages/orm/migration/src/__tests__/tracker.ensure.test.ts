import { describe, expect, it } from "bun:test";

import { MigrationTracker } from "../tracker";
import { makeFakePool, norm } from "./tracker.test.fixture";

describe("MigrationTracker.ensureTable", () => {
  it("issues a single CREATE TABLE IF NOT EXISTS for the tracking table", async () => {
    const { pool, queries } = makeFakePool();
    await new MigrationTracker(pool).ensureTable();

    expect(queries).toHaveLength(1);
    const sql = norm(queries[0]!.sql);
    expect(sql).toContain(
      'CREATE TABLE IF NOT EXISTS "damat"."_damat_migration_logs"',
    );
    expect(sql).toContain('CREATE SCHEMA "damat"');
    expect(sql).toContain('"id" TEXT PRIMARY KEY');
    expect(sql).toContain('UNIQUE ("module", "name")');
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS "idx__damat_migration_logs_module"',
    );
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS "idx__damat_migration_logs_status"',
    );
  });
});
