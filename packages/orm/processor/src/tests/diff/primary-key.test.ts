import { describe, expect, test } from "bun:test";
import { diffSchemas } from "../../diff/diffSchemas";
import { reverseDiff } from "../../diff/reverse";
import { col, moduleSchema, table } from "../__fixtures__/schemas";

describe("primary key column changes", () => {
  test("diffs and reverses an added primary key", () => {
    const previous = moduleSchema({
      tables: [table("items", [col("id")])],
    });
    const current = moduleSchema({
      tables: [table("items", [col("id", { primaryKey: true })])],
    });

    const diff = diffSchemas(previous, current);
    expect(diff.changes).toEqual([
      expect.objectContaining({
        type: "alter_column",
        tableName: "items",
        columnName: "id",
        changes: { primaryKey: { from: false, to: true } },
      }),
    ]);
    expect(reverseDiff(diff).changes).toEqual([
      expect.objectContaining({
        type: "alter_column",
        changes: { primaryKey: { from: true, to: false } },
      }),
    ]);
  });
});
