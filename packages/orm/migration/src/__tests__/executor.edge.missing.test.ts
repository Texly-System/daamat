import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";

import { executeMigration } from "../executor/migration";
import { MigrationTracker } from "../tracker";
import {
  makeFakePool,
  makeMigrationInfo,
  makeModule,
} from "./executor.test.fixture";

let tmpRoot = "";
beforeEach(() => {
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-edge-missing-");
});
afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe("executeMigration — file-not-found", () => {
  it("returns failure (does not throw) and never opens a transaction", async () => {
    const mod = makeModule(tmpRoot, 0, []);
    const fake = makeFakePool();
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration404_Missing"),
      "user",
      new MigrationTracker(fake.pool),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(fake.connectCount).toBe(0);
    expect(fake.clientQueries).toHaveLength(0);
    expect(fake.releaseCount).toBe(0);
    expect(
      fake.clientQueries.some((query) =>
        /INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(query.sql),
      ),
    ).toBe(false);
    expect(result.error!.message).toMatch(/ENOENT|no such file/i);
  });
});
