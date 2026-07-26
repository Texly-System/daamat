import { describe, expect, test } from "bun:test";
import type { ConstraintSchema } from "@damatjs/orm-type";
import { diffSchemas } from "../../diff/diffSchemas";
import { generateFromDiff } from "../../sqlGenerator/generateMigration/generateFromDiff";
import { generateFromSnapshot } from "../../sqlGenerator/generateMigration/generateFromSnapshot";
import { reverseDiff } from "../../diff/reverse";

const column = { name: "id", type: "text" as const, nullable: false };
const snapshot = (constraints: ConstraintSchema[] = []) => ({
  moduleName: "store",
  schema: "module_default",
  tables: [{ name: "items", schema: "tenant", columns: [column], constraints }],
});

describe("table constraint generation", () => {
  test("emits indexes, constraints, then foreign keys for new tables", () => {
    const value = snapshot([
      { name: "items_pk", type: "primary_key", columns: ["id"] },
      { name: "items_check", type: "check", condition: "id <> ''" },
      {
        name: "items_excl",
        type: "exclude",
        expressions: [{ column: "id", operator: "=" }],
        where: "id <> ''",
      },
    ]);
    const sql = generateFromSnapshot(value).upStatements;
    expect(sql[0]).toContain('CREATE TABLE IF NOT EXISTS "tenant"."items"');
    expect(sql[1]).toContain('ADD CONSTRAINT "items_pk" PRIMARY KEY');
    expect(sql[2]).toContain('ADD CONSTRAINT "items_check" CHECK');
    expect(sql[3]).toContain("EXCLUDE USING GIST");
    expect(sql[3]).toContain("WHERE (id <> '')");
  });

  test("uses a unique index for a partial unique constraint", () => {
    const sql = generateFromSnapshot(
      snapshot([
        {
          name: "items_live",
          type: "unique",
          columns: ["id"],
          where: "id <> ''",
        },
      ]),
    ).upStatements[1]!;
    expect(sql).toBe(
      'CREATE UNIQUE INDEX "items_live" ON "tenant"."items" ("id") WHERE id <> \'\'',
    );
  });

  test("replaces a changed same-name constraint with drop then add", () => {
    const oldSchema = snapshot([
      { name: "items_check", type: "check", condition: "id <> ''" },
    ]);
    const nextSchema = snapshot([
      { name: "items_check", type: "check", condition: "length(id) > 1" },
    ]);
    const migration = generateFromDiff(diffSchemas(oldSchema, nextSchema));
    expect(migration.upStatements[0]).toContain("DROP CONSTRAINT");
    expect(migration.upStatements[1]).toContain("ADD CONSTRAINT");
    expect(migration.warnings[0]).toContain("Replacing constraint");
  });

  test("adds, removes, and reverses constraints with destructive warnings", () => {
    const constraint: ConstraintSchema = {
      name: "items_unique",
      type: "unique",
      columns: ["id"],
      deferrable: true,
      initiallyDeferred: true,
    };
    const added = diffSchemas(snapshot(), snapshot([constraint]));
    expect(added.changes[0]!.type).toBe("add_constraint");
    expect(generateFromDiff(added).upStatements[0]).toContain(
      "DEFERRABLE INITIALLY DEFERRED",
    );
    expect(reverseDiff(added).changes[0]!.type).toBe("drop_constraint");
    const removed = diffSchemas(snapshot([constraint]), snapshot());
    expect(generateFromDiff(removed).upStatements[0]).toContain(
      "DROP CONSTRAINT",
    );
    expect(removed.warnings[0]).toContain("removes an integrity rule");
  });

});
