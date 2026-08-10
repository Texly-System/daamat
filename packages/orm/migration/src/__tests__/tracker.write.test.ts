import { describe, expect, it } from "bun:test";
import { MigrationTracker } from "../tracker";
import { makeFakePool, norm } from "./tracker.test.fixture";

describe("MigrationTracker.recordApplied", () => {
  it("UPSERTs on UNIQUE(module, name) with a collision-free id and the execution time", async () => {
    const { pool, queries } = makeFakePool();
    await new MigrationTracker(pool).recordApplied(
      "user",
      "Migration1_Initial",
      150,
    );

    expect(queries).toHaveLength(1);
    const sql = norm(queries[0]!.sql);
    expect(sql).toContain('INSERT INTO "damat"."_damat_migration_logs"');
    expect(sql).toContain("ON CONFLICT (module, name) DO UPDATE SET");
    expect(sql).toContain("status = 'applied'");
    expect(queries[0]!.params).toEqual([
      "4_user_Migration1_Initial",
      "user",
      "Migration1_Initial",
      150,
    ]);
  });
});

describe("MigrationTracker.recordReverted", () => {
  it("marks the row reverted by (module, name)", async () => {
    const { pool, queries } = makeFakePool();
    await new MigrationTracker(pool).recordReverted(
      "user",
      "Migration1_Initial",
    );

    const sql = norm(queries[0]!.sql);
    expect(sql).toContain('UPDATE "damat"."_damat_migration_logs"');
    expect(sql).toContain("status = 'reverted'");
    expect(sql).toContain("WHERE module = $1 AND name = $2");
    expect(queries[0]!.params).toEqual(["user", "Migration1_Initial"]);
  });
});
