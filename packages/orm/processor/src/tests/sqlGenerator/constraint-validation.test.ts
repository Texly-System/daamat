import { describe, expect, test } from "bun:test";
import type { ConstraintSchema } from "@damatjs/orm-type";
import { diffSchemas } from "../../diff/diffSchemas";
import { generateFromDiff } from "../../sqlGenerator/generateMigration/generateFromDiff";
import { generateFromSnapshot } from "../../sqlGenerator/generateMigration/generateFromSnapshot";

const column = { name: "id", type: "text" as const, nullable: false };
const snapshot = (constraints: ConstraintSchema[] = []) => ({
  moduleName: "store",
  schema: "module_default",
  tables: [{ name: "items", schema: "tenant", columns: [column], constraints }],
});

describe("constraint validation", () => {
  test("drops partial unique constraints as indexes", () => {
    const partial: ConstraintSchema = {
      name: "items_live",
      type: "unique",
      columns: ["id"],
      where: "id <> ''",
    };
    const diff = diffSchemas(snapshot([partial]), snapshot());
    expect(generateFromDiff(diff).upStatements[0]).toBe(
      'DROP INDEX IF EXISTS "tenant"."items_live"',
    );
    expect(generateFromDiff(diff, { safeMode: false }).upStatements[0]).toBe(
      'DROP INDEX "tenant"."items_live"',
    );
  });

  test("rejects invalid constraint combinations", () => {
    const invalid: Array<[ConstraintSchema, string]> = [
      [
        { name: "bad_pk", type: "primary_key", columns: ["id"], where: "true" },
        "cannot be partial",
      ],
      [
        { name: "bad_check", type: "check", condition: "true", deferrable: true },
        "cannot be deferrable",
      ],
      [
        { name: "bad_where", type: "check", condition: "true", where: "true" },
        "cannot use WHERE",
      ],
      [{ name: "empty_unique", type: "unique", columns: [] }, "requires columns"],
      [
        { name: "empty_exclude", type: "exclude", expressions: [] },
        "requires expressions",
      ],
    ];
    for (const [constraint, message] of invalid) {
      expect(() => generateFromSnapshot(snapshot([constraint]))).toThrow(message);
    }
  });

  test("fails closed when a table moves between schemas", () => {
    const moved = snapshot();
    moved.tables[0]!.schema = "other";
    expect(() => diffSchemas(snapshot(), moved)).toThrow("Changing table schema");
  });

  test("diffs unnamed constraints before generation rejects them", () => {
    const unnamed: ConstraintSchema = { type: "unique", columns: ["id"] };
    const diff = diffSchemas(snapshot(), snapshot([unnamed]));
    expect(diff.changes[0]!.type).toBe("add_constraint");
    expect(() => generateFromDiff(diff)).toThrow("require a name");
  });
});
