import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";

import { runMigrations } from "../executor/run";
import { container } from "./executor.container.fixture";
import { makeFakePool, makeModule } from "./executor.test.fixture";

let tmpRoot = "";
let moduleCounter = 0;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-run-");
});
afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe("runMigrations", () => {
  it("bootstraps, applies all pending migrations in order, and records them", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_Initial" },
      { name: "Migration20260201000000_AddEmail" },
    ]);
    const fake = makeFakePool();
    const results = await runMigrations(fake.pool, container([mod]) as any);

    expect(results).toHaveLength(1);
    expect(results[0]!.success).toBe(true);
    expect(results[0]!.applied).toEqual([
      "Migration20260101000000_Initial",
      "Migration20260201000000_AddEmail",
    ]);
    expect(results[0]!.pending).toEqual(results[0]!.applied);
    expect(
      fake.poolQueries.some((query) =>
        /CREATE TABLE IF NOT EXISTS (?:"damat"\.)?"_damat_migration_logs"/.test(
          query.sql,
        ),
      ),
    ).toBe(true);
    expect(
      fake.clientQueries.some((query) => /generate_id/.test(query.sql)),
    ).toBe(true);
  });

  it("skips migrations already recorded as applied (idempotency)", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_Initial" },
      { name: "Migration20260201000000_AddEmail" },
    ]);
    const fake = makeFakePool({
      applied: {
        [mod.name]: [
          {
            module: mod.name,
            name: "Migration20260101000000_Initial",
            applied_at: new Date(),
          },
        ],
      },
    });
    const results = await runMigrations(fake.pool, container([mod]) as any);

    expect(results[0]!.pending).toEqual(["Migration20260201000000_AddEmail"]);
    expect(results[0]!.applied).toEqual(["Migration20260201000000_AddEmail"]);
    expect(fake.clientQueries.filter((q) => q.sql === "BEGIN")).toHaveLength(1);
    const inserts = fake.clientQueries.filter((q) =>
      /INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(q.sql),
    );
    expect(inserts).toHaveLength(1);
    expect(inserts[0]!.params?.[2]).toBe("Migration20260201000000_AddEmail");
  });

  it("reports no pending migrations when all are applied", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_Initial" },
    ]);
    const fake = makeFakePool({
      applied: {
        [mod.name]: [
          {
            module: mod.name,
            name: "Migration20260101000000_Initial",
            applied_at: new Date(),
          },
        ],
      },
    });
    const results = await runMigrations(fake.pool, container([mod]) as any);
    expect(results[0]!.applied).toEqual([]);
    expect(results[0]!.pending).toEqual([]);
    expect(results[0]!.success).toBe(true);
    expect(fake.clientQueries.some((q) => q.sql === "BEGIN")).toBe(false);
  });
});
