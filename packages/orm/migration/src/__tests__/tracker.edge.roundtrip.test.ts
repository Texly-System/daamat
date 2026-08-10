import { describe, expect, it } from "bun:test";
import type { AppliedMigration } from "../tracker";
import { MigrationTracker } from "../tracker";
import { makeFakePool } from "./tracker.test.fixture";

describe("MigrationTracker round-trip: record then read", () => {
  it("getApplied returns only rows the fake DB reports as applied for the module", async () => {
    const recorded: Record<string, AppliedMigration[]> = {};
    const { pool } = makeFakePool((sql, params) => {
      if (/INSERT INTO/.test(sql)) {
        const [, module, name] = params as [string, string, string, number];
        (recorded[module] ??= []).push({
          module,
          name,
          applied_at: new Date("2026-01-01"),
        });
        return [];
      }
      if (/SELECT/.test(sql) && /status = 'applied'/.test(sql)) {
        const module = params?.[0] as string | undefined;
        return module
          ? (recorded[module] ?? [])
          : Object.values(recorded).flat();
      }
      return [];
    });
    const tracker = new MigrationTracker(pool);
    await tracker.recordApplied("user", "Migration1_Initial", 5);
    await tracker.recordApplied("user", "Migration2_AddEmail", 5);
    await tracker.recordApplied("billing", "Migration1_Invoices", 5);

    expect((await tracker.getApplied("user")).map((row) => row.name)).toEqual([
      "Migration1_Initial",
      "Migration2_AddEmail",
    ]);
    expect(await tracker.getApplied()).toHaveLength(3);
  });

  it("getApplied returns [] for a module with nothing recorded", async () => {
    const { pool } = makeFakePool(() => []);
    expect(await new MigrationTracker(pool).getApplied("ghost")).toEqual([]);
  });
});
