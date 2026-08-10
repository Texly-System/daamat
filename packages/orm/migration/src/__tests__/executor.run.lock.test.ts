import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";

import { runMigrations } from "../executor/run";
import { container } from "./executor.container.fixture";
import { makeFakePool, makeModule } from "./executor.test.fixture";

let tmpRoot = "";
let moduleCounter = 0;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-run-lock-");
});
afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe("runMigrations advisory locking", () => {
  it("holds pg_advisory_lock for the whole run and always unlocks", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_Initial" },
    ]);
    const fake = makeFakePool();
    await runMigrations(fake.pool, container([mod]) as any);

    const sqls = fake.clientQueries.map((query) => query.sql);
    expect(sqls[0]).toMatch(/pg_advisory_lock\(\d+\)/);
    expect(sqls.at(-1)).toMatch(/pg_advisory_unlock\(\d+\)/);
    expect(sqls[0]!.match(/\d+/)![0]).toBe(sqls.at(-1)!.match(/\d+/)![0]);
  });

  it("unlocks and releases the lock session even when a migration fails", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_Bad", sql: "BAD;" },
    ]);
    const fake = makeFakePool({ failOn: (sql) => sql === "BAD;" });
    const results = await runMigrations(fake.pool, container([mod]) as any);

    expect(results[0]!.success).toBe(false);
    const sqls = fake.clientQueries.map((query) => query.sql);
    expect(sqls.at(-1)).toMatch(/pg_advisory_unlock/);
    expect(fake.releaseCount).toBe(fake.connectCount);
  });

  it("processes multiple modules, returning one result per module", async () => {
    const a = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_A" },
    ]);
    const b = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_B" },
    ]);
    const results = await runMigrations(
      makeFakePool().pool,
      container([a, b]) as any,
    );
    expect(results).toHaveLength(2);
    expect(results.every((result) => result.success)).toBe(true);
  });
});
