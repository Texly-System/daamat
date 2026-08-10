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
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-edge-autocommit-");
});
afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe("executeMigration — statements that can't run in a transaction", () => {
  it("runs a CREATE INDEX CONCURRENTLY migration WITHOUT BEGIN/COMMIT and records it applied", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      {
        name: "Migration1_Concurrent",
        sql: 'CREATE INDEX CONCURRENTLY "idx_u" ON users (email);',
      },
    ]);
    const fake = makeFakePool();
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_Concurrent"),
      "user",
      new MigrationTracker(fake.pool),
    );
    expect(result.success).toBe(true);
    const sqls = fake.clientQueries.map((query) => query.sql);
    expect(sqls).not.toContain("BEGIN");
    expect(sqls).not.toContain("COMMIT");
    expect(sqls).toContain(
      'CREATE INDEX CONCURRENTLY "idx_u" ON users (email);',
    );
    expect(fake.releaseCount).toBe(1);
    expect(
      fake.clientQueries.some((query) =>
        /INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(query.sql),
      ),
    ).toBe(true);
  });

  it("runs an ALTER TYPE ... ADD VALUE migration outside a transaction", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      {
        name: "Migration1_Enum",
        sql: "ALTER TYPE mood ADD VALUE 'excited';",
      },
    ]);
    const fake = makeFakePool();
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_Enum"),
      "user",
      new MigrationTracker(fake.pool),
    );
    expect(result.success).toBe(true);
    const sqls = fake.clientQueries.map((query) => query.sql);
    expect(sqls[0]).toBe("ALTER TYPE mood ADD VALUE 'excited';");
    expect(sqls[1]).toContain('INSERT INTO "damat"."_damat_migration_logs"');
  });

  it("does NOT issue ROLLBACK when a non-transactional migration fails", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      {
        name: "Migration1_ConcurrentBad",
        sql: "CREATE INDEX CONCURRENTLY bad;",
      },
    ]);
    const fake = makeFakePool({
      failOn: (sql) => sql === "CREATE INDEX CONCURRENTLY bad;",
    });
    const result = await executeMigration(
      fake.pool,
      makeMigrationInfo(mod.dir, "Migration1_ConcurrentBad"),
      "user",
      new MigrationTracker(fake.pool),
    );
    expect(result.success).toBe(false);
    const sqls = fake.clientQueries.map((query) => query.sql);
    expect(sqls).not.toContain("ROLLBACK");
    expect(sqls).not.toContain("BEGIN");
    expect(
      fake.poolQueries.some((query) =>
        /INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(query.sql),
      ),
    ).toBe(false);
    expect(fake.releaseCount).toBe(1);
  });
});
