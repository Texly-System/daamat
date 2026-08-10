import { describe, expect, it } from "bun:test";
import { MigrationTracker } from "../tracker";
import { makeFakePool, norm } from "./tracker.test.fixture";

describe("MigrationTracker.recordApplied — UPSERT idempotency", () => {
  it("applying the same migration twice keeps the same id (ON CONFLICT path)", async () => {
    const { pool, queries } = makeFakePool();
    const tracker = new MigrationTracker(pool);
    await tracker.recordApplied("user", "Migration1_Initial", 100);
    await tracker.recordApplied("user", "Migration1_Initial", 250);

    expect(queries).toHaveLength(2);
    expect(queries[0]!.params?.[0]).toBe("4_user_Migration1_Initial");
    expect(queries[1]!.params?.[0]).toBe("4_user_Migration1_Initial");
    expect(queries[1]!.params?.[3]).toBe(250);
    const sql = norm(queries[1]!.sql);
    expect(sql).toContain("ON CONFLICT (module, name) DO UPDATE SET");
    expect(sql).toContain("reverted_at = NULL");
    expect(sql).toContain("status = 'applied'");
  });

  it("distinct module+name pairs produce distinct ids", async () => {
    const { pool, queries } = makeFakePool();
    const tracker = new MigrationTracker(pool);
    await tracker.recordApplied("user", "Migration1_Initial", 10);
    await tracker.recordApplied("billing", "Migration1_Initial", 10);
    await tracker.recordApplied("user", "Migration2_AddEmail", 10);
    expect(queries.map((query) => query.params?.[0])).toEqual([
      "4_user_Migration1_Initial",
      "7_billing_Migration1_Initial",
      "4_user_Migration2_AddEmail",
    ]);
  });

  it("colliding (module, name) pairs still produce distinct ids (a_b/c vs a/b_c)", async () => {
    const { pool, queries } = makeFakePool();
    const tracker = new MigrationTracker(pool);
    await tracker.recordApplied("a_b", "c", 1);
    await tracker.recordApplied("a", "b_c", 1);
    expect(queries[0]!.params?.[0]).toBe("3_a_b_c");
    expect(queries[1]!.params?.[0]).toBe("1_a_b_c");
    expect(queries[0]!.params?.[0]).not.toBe(queries[1]!.params?.[0]);
  });

  it("passes a zero execution time through unchanged", async () => {
    const { pool, queries } = makeFakePool();
    await new MigrationTracker(pool).recordApplied("user", "M1", 0);
    expect(queries[0]!.params?.[3]).toBe(0);
  });
});
