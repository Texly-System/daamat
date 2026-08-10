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
let moduleCounter = 0;
beforeEach(() => {
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-edge-rollback-");
});
afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe("executeMigration — invalid SQL / rollback path", () => {
  it("ROLLBACK is issued (and COMMIT is not) when the body query fails", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      {
        name: "Migration1_Invalid",
        sql: "THIS IS NOT SQL;",
      },
    ]);
    const fake = makeFakePool({ failOn: (sql) => sql === "THIS IS NOT SQL;" });
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_Invalid"),
      "user",
      new MigrationTracker(fake.pool),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(fake.clientQueries.map((query) => query.sql)).toEqual([
      "BEGIN",
      "THIS IS NOT SQL;",
      "ROLLBACK",
    ]);
    expect(result.error!.message).toContain("boom");
    expect(
      fake.clientQueries.some((query) =>
        /INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(query.sql),
      ),
    ).toBe(false);
    expect(fake.releaseCount).toBe(1);
  });

  it("surfaces the original error (not the rollback's) when ROLLBACK also fails", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      {
        name: "Migration1_Bad",
        sql: "BAD BODY;",
      },
    ]);
    const fake = makeFakePool({
      failOn: (sql) => sql === "BAD BODY;" || sql === "ROLLBACK",
    });
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_Bad"),
      "user",
      new MigrationTracker(fake.pool),
    );
    expect(result.success).toBe(false);
    expect(result.error!.message).toContain("BAD BODY;");
    expect(result.error!.message).not.toContain("ROLLBACK");
    expect(fake.releaseCount).toBe(1);
  });

  it("does not re-throw to the caller — returns a failure result instead", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      {
        name: "Migration1_Bad",
        sql: "BAD;",
      },
    ]);
    const fake = makeFakePool({ failOn: (sql) => sql === "BAD;" });
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_Bad"),
      "user",
      new MigrationTracker(fake.pool),
    );
    expect(result.success).toBe(false);
  });
});
