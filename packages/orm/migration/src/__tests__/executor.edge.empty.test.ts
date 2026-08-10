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
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-edge-empty-");
});
afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe("executeMigration — empty / whitespace migration file", () => {
  it("commits an empty migration file (no SQL body) and records it applied", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      {
        name: "Migration1_Empty",
        sql: "",
      },
    ]);
    const fake = makeFakePool();
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_Empty"),
      "user",
      new MigrationTracker(fake.pool),
    );

    expect(result.success).toBe(true);
    const sqls = fake.clientQueries.map((query) => query.sql);
    expect(sqls[0]).toBe("BEGIN");
    expect(sqls).toContain("");
    expect(sqls.at(-1)).toBe("COMMIT");
    expect(sqls).not.toContain("ROLLBACK");
    expect(
      fake.clientQueries.some((query) =>
        /INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(query.sql),
      ),
    ).toBe(true);
    expect(fake.releaseCount).toBe(1);
  });

  it("commits a comments-only migration file and records it applied", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      {
        name: "Migration1_CommentsOnly",
        sql: "-- nothing to do here\n",
      },
    ]);
    const fake = makeFakePool();
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_CommentsOnly"),
      "user",
      new MigrationTracker(fake.pool),
    );
    expect(result.success).toBe(true);
    expect(fake.clientQueries.map((query) => query.sql)).toContain(
      "-- nothing to do here\n",
    );
  });
});
