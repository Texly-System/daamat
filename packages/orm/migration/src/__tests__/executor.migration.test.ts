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
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-exec-");
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe("executeMigration", () => {
  it("runs the SQL inside a BEGIN/COMMIT transaction and records it applied", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration1_Initial", sql: "CREATE TABLE users (id text);" },
    ]);
    const fake = makeFakePool();
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_Initial"),
      "user",
      new MigrationTracker(fake.pool),
    );

    expect(result.success).toBe(true);
    const sqls = fake.clientQueries.map((query) => query.sql);
    expect(sqls[0]).toBe("BEGIN");
    expect(sqls).toContain("CREATE TABLE users (id text);");
    expect(sqls.at(-1)).toBe("COMMIT");
    expect(fake.releaseCount).toBe(1);
    const insert = fake.clientQueries.find((query) =>
      /INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(query.sql),
    );
    expect(insert).toBeDefined();
    expect(insert!.params?.[1]).toBe("user");
    expect(insert!.params?.[2]).toBe("Migration1_Initial");
  });

  it("rolls back and returns the error when the SQL fails", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration1_Bad", sql: "BAD SQL;" },
    ]);
    const fake = makeFakePool({ failOn: (sql) => sql === "BAD SQL;" });
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_Bad"),
      "user",
      new MigrationTracker(fake.pool),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(fake.clientQueries.map((query) => query.sql)).toContain("ROLLBACK");
    expect(fake.clientQueries.map((query) => query.sql)).not.toContain(
      "COMMIT",
    );
    expect(
      fake.poolQueries.some((query) =>
        /INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(query.sql),
      ),
    ).toBe(false);
    expect(fake.releaseCount).toBe(1);
  });

  it("returns failure (not throw) when the migration file is missing", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, []);
    const fake = makeFakePool();
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration404_Missing"),
      "user",
      new MigrationTracker(fake.pool),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
