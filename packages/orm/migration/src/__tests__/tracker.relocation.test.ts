import { expect, test } from "bun:test";
import { MigrationTracker } from "../tracker";

function fakePool() {
  const sql: string[] = [];
  return {
    pool: {
      query: async (statement: string) => {
        sql.push(statement);
        return { rows: [], rowCount: 0 };
      },
    } as any,
    sql,
  };
}

test("tracker creates damat and moves a legacy public table", async () => {
  const fake = fakePool();
  await new MigrationTracker(fake.pool).ensureTable();
  expect(fake.sql[0]).toContain('CREATE SCHEMA "damat"');
  expect(fake.sql[0]).toContain(
    'ALTER TABLE "public"."_damat_migration_logs" SET SCHEMA "damat"',
  );
  expect(fake.sql[0]).toContain("both \"public\".\"_damat_migration_logs\"");
});

test("tracker DDL is repeatable and all reads/writes are qualified", async () => {
  const fake = fakePool();
  const tracker = new MigrationTracker(fake.pool);
  await tracker.ensureTable();
  await tracker.ensureTable();
  expect(fake.sql[0]).toBe(fake.sql[1]);
  await tracker.getApplied("orders");
  await tracker.recordApplied("orders", "M1", 1);
  await tracker.recordReverted("orders", "M1");
  expect(fake.sql.slice(2).every((sql) =>
    sql.includes('"damat"."_damat_migration_logs"'),
  )).toBe(true);
});
