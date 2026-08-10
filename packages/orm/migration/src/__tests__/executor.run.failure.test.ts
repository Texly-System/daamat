import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";

import { runMigrations } from "../executor/run";
import { container } from "./executor.container.fixture";
import { makeFakePool, makeModule } from "./executor.test.fixture";

let tmpRoot = "";
let moduleCounter = 0;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-run-failure-");
});
afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe("runMigrations", () => {
  it("stops applying after the first failing migration and surfaces the error", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_Ok", sql: "SELECT 1;" },
      { name: "Migration20260201000000_Bad", sql: "FAIL HERE;" },
      { name: "Migration20260301000000_Never", sql: "SELECT 2;" },
    ]);
    const fake = makeFakePool({ failOn: (sql) => sql === "FAIL HERE;" });
    const results = await runMigrations(fake.pool, container([mod]) as any);

    expect(results[0]!.success).toBe(false);
    expect(results[0]!.error).toBeInstanceOf(Error);
    expect(results[0]!.applied).toEqual(["Migration20260101000000_Ok"]);
    expect(fake.clientQueries.some((q) => q.sql === "SELECT 2;")).toBe(false);
  });
});
