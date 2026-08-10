import { describe, expect, it } from "bun:test";
import { MigrationTracker } from "../tracker";
import type { AppliedMigration } from "../tracker";
import { makeFakePool, norm } from "./tracker.test.fixture";

describe("MigrationTracker.getApplied", () => {
  it("filters by module with status='applied' and oldest-first ordering", async () => {
    const canned: AppliedMigration[] = [
      {
        module: "user",
        name: "Migration1_Initial",
        applied_at: new Date("2026-01-01"),
      },
    ];
    const { pool, queries } = makeFakePool(canned as any);
    const result = await new MigrationTracker(pool).getApplied("user");

    expect(result).toEqual(canned);
    expect(queries).toHaveLength(1);
    const sql = norm(queries[0]!.sql);
    expect(sql).toContain("WHERE status = 'applied' AND module = $1");
    expect(sql).toContain("ORDER BY applied_at ASC");
    expect(queries[0]!.params).toEqual(["user"]);
  });

  it("queries all modules (no params) when moduleName is omitted", async () => {
    const { pool, queries } = makeFakePool([]);
    const result = await new MigrationTracker(pool).getApplied();

    expect(result).toEqual([]);
    const sql = norm(queries[0]!.sql);
    expect(sql).toContain("WHERE status = 'applied'");
    expect(sql).not.toContain("module = $1");
    expect(queries[0]!.params).toBeUndefined();
  });
});
