import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { adoptMigration } from "../executor/adopt";
import { migrationFileChecksum } from "../executor/checksum";
let root: string;
let migrationPath: string;
function moduleConfig() {
  return { id: "demo", name: "demo", path: root, resolve: root };
}
function pool(applied = false, inserted = true) {
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  return {
    calls,
    value: {
      query: async (sql: string, params?: unknown[]) => {
        calls.push({ sql, params });
        if (/status = 'applied'/.test(sql)) {
          const rows = applied ? [{ module: "demo", name: "Migration1_Index" }] : [];
          return { rows, rowCount: rows.length };
        }
        if (/INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(sql)) {
          return { rows: [], rowCount: inserted ? 1 : 0 };
        }
        return { rows: [], rowCount: 0 };
      },
    } as never,
  };
}
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "damat-adopt-"));
  mkdirSync(join(root, "migrations"));
  migrationPath = join(root, "migrations", "Migration1_Index.sql");
  writeFileSync(migrationPath, "CREATE INDEX CONCURRENTLY idx ON items(id);\n");
});
afterEach(() => rmSync(root, { recursive: true, force: true }));
describe("adoptMigration", () => {
  test("records an audited exact checksum adoption", async () => {
    const fake = pool();
    const checksum = migrationFileChecksum(migrationPath);
    await adoptMigration(fake.value, moduleConfig(), "Migration1_Index.sql", {
      checksum,
      actor: "release-bot",
      reason: "concurrent index committed",
    });
    const insert = fake.calls.find((call) =>
      /INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(call.sql),
    )!;
    expect(insert.params).toEqual([
      expect.any(String),
      "demo",
      "Migration1_Index",
      checksum,
      "release-bot",
      "concurrent index committed",
    ]);
  });
  test("rejects missing, transactional, mismatched, and applied migrations", async () => {
    await expect(
      adoptMigration(pool().value, moduleConfig(), "missing", {
        checksum: "x",
        actor: "a",
        reason: "r",
      }),
    ).rejects.toThrow("was not found");
    writeFileSync(migrationPath, "CREATE TABLE items(id text);\n");
    await expect(
      adoptMigration(pool().value, moduleConfig(), "Migration1_Index", {
        checksum: migrationFileChecksum(migrationPath),
        actor: "a",
        reason: "r",
      }),
    ).rejects.toThrow("is transactional");
    writeFileSync(migrationPath, "CREATE INDEX CONCURRENTLY idx ON items(id);\n");
    await expect(
      adoptMigration(pool().value, moduleConfig(), "Migration1_Index", {
        checksum: "0".repeat(64),
        actor: "a",
        reason: "r",
      }),
    ).rejects.toThrow("Checksum mismatch");
    await expect(
      adoptMigration(pool(true).value, moduleConfig(), "Migration1_Index", {
        checksum: migrationFileChecksum(migrationPath),
        actor: "a",
        reason: "r",
      }),
    ).rejects.toThrow("already applied");
  });
  test("rejects a concurrent adoption winner", async () => {
    await expect(
      adoptMigration(pool(false, false).value, moduleConfig(), "Migration1_Index", {
        checksum: migrationFileChecksum(migrationPath),
        actor: "a",
        reason: "r",
      }),
    ).rejects.toThrow("already applied");
  });
});
