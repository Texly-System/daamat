import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";

import { CommittedMigrationUntrackedError } from "../executor/errors";
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
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-edge-tracker-");
});
afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

const trackerInsert = (sql: string) =>
  /INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(sql);

describe("executeMigration — non-transactional tracker failure", () => {
  it("reports committed SQL that could not be tracked", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      {
        name: "Migration1_Index",
        sql: "CREATE INDEX CONCURRENTLY idx ON t(id);",
      },
    ]);
    const fake = makeFakePool({ failOn: trackerInsert });
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_Index"),
      "user",
      new MigrationTracker(fake.pool),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(CommittedMigrationUntrackedError);
    expect((result.error as CommittedMigrationUntrackedError).code).toBe(
      "MIGRATION_COMMITTED_UNTRACKED",
    );
    expect(fake.clientQueries.map((query) => query.sql)).not.toContain(
      "ROLLBACK",
    );
  });
});

describe("executeMigration — transactional tracker failure", () => {
  it("rolls back migration SQL and its tracker row together", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      {
        name: "Migration1_Ok",
        sql: "CREATE TABLE t (id text);",
      },
    ]);
    const fake = makeFakePool({ failOn: trackerInsert });
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_Ok"),
      "user",
      new MigrationTracker(fake.pool),
    );
    const sqls = fake.clientQueries.map((query) => query.sql);
    expect(sqls).not.toContain("COMMIT");
    expect(sqls).toContain("ROLLBACK");
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toContain("boom");
  });
});
