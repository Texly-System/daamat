import type { AlterColumnChange } from "../types/diff";
import { PRIORITY } from "./priority";

export function reverseAlter(change: AlterColumnChange): AlterColumnChange {
  const reversed: AlterColumnChange["changes"] = {};
  const entries = Object.entries(change.changes);
  for (const [key, pair] of entries) {
    if (!pair) continue;
    const value = { from: pair.to, to: pair.from };
    (reversed as Record<string, unknown>)[key] = value;
  }
  return {
    type: "alter_column",
    tableName: change.tableName,
    columnName: change.columnName,
    schema: change.schema,
    changes: reversed,
    priority: PRIORITY.ALTER_COLUMN,
  };
}
