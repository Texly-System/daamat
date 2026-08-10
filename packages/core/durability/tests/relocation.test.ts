import { expect, test } from "bun:test";
import {
  damatRelation,
  durabilitySystemMigrations,
  relocateDamatRelations,
} from "../src";

test("damatRelation qualifies and normalizes Damat table names", () => {
  expect(damatRelation("_damat_workers")).toBe('"damat"."_damat_workers"');
  expect(damatRelation("workers")).toBe('"damat"."_damat_workers"');
  expect(() => damatRelation("workers;DROP TABLE users")).toThrow(/invalid/i);
});

test("relocation SQL is idempotent and rejects target conflicts", () => {
  const sql = relocateDamatRelations(["_damat_workers", "workers"]);
  expect(sql.match(/DO \$damat_relocate\$/g)).toHaveLength(1);
  expect(sql).toContain('CREATE SCHEMA "damat"');
  expect(sql).toContain("non-Damat relation");
  expect(sql).toContain("requires USAGE and CREATE");
  expect(sql).toContain(
    'ALTER TABLE "public"."_damat_workers" SET SCHEMA "damat"',
  );
  expect(sql).toContain('both "public"."_damat_workers" and "damat"');
});

test("shared relocation follows every existing baseline migration", () => {
  const migrations = durabilitySystemMigrations.migrations;
  const relocation = migrations.find((migration) => migration.id === "006");
  expect(relocation?.order).toBe(1200);
  expect(relocation?.sql).toContain('"_damat_retention_overrides"');
  const baselines = migrations
    .filter((migration) => migration.id !== "006")
    .map((migration) => migration.order);
  expect(relocation?.order).toBeGreaterThan(Math.max(...baselines));
});
