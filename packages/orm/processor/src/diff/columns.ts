import type { ColumnSchema } from "@damatjs/orm-type";
import type {
  AddColumnChange,
  AlterColumnChange,
  DropColumnChange,
  SchemaChange,
} from "../types/diff";
import { PRIORITY } from "./priority";
import { createNameMap, columnsEqual } from "./utils";
import { columnAlteration } from "./columnChanges";

/** Diff columns between two versions of a table. */
export function diffColumns(
  tableName: string,
  oldColumns: ColumnSchema[],
  newColumns: ColumnSchema[],
  schema = "public",
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  const oldMap = createNameMap(oldColumns);
  const newMap = createNameMap(newColumns);

  for (const [name, column] of newMap) {
    if (!oldMap.has(name)) {
      changes.push({
        type: "add_column",
        tableName,
        column,
        schema,
        priority: PRIORITY.ADD_COLUMN,
      } as AddColumnChange);
    }
  }
  for (const [name] of oldMap) {
    if (!newMap.has(name)) {
      changes.push({
        type: "drop_column",
        tableName,
        columnName: name,
        schema,
        priority: PRIORITY.DROP_COLUMN,
      } as DropColumnChange);
    }
  }

  for (const [name, newColumn] of newMap) {
    const oldColumn = oldMap.get(name);
    if (!oldColumn || columnsEqual(oldColumn, newColumn)) continue;
    const alteration = columnAlteration(tableName, name, oldColumn, newColumn);
    changes.push({
      type: "alter_column",
      tableName,
      columnName: name,
      schema,
      changes: alteration.changes,
      ...(alteration.manualReview
        ? { manualReview: alteration.manualReview }
        : {}),
      priority: PRIORITY.ALTER_COLUMN,
    } as AlterColumnChange);
  }
  return changes;
}
