import type { IndexSchema } from "@damatjs/orm-type";
import type {
  AddIndexChange,
  DropIndexChange,
  SchemaChange,
} from "../types/diff";
import { PRIORITY } from "./priority";
import { createNameMap, indexesEqual } from "./utils";

function getIndexName(tableName: string, index: IndexSchema): string {
  if (index.name) return index.name;
  if (index.columns.some((column) => typeof column !== "string" && "expression" in column)) {
    throw new Error("Expression indexes require an explicit name");
  }
  const cols = index.columns
    .map((column) => (typeof column === "string" ? column : column.name))
    .join("_");
  return `${tableName}_${cols}_idx`;
}

/**
 * Diff indexes between two versions of a table.
 * A changed index is handled as drop + re-add since indexes cannot be altered in place.
 */
export function diffIndexes(
  tableName: string,
  oldIndexes: IndexSchema[],
  newIndexes: IndexSchema[],
  schema = "public",
): SchemaChange[] {
  const changes: SchemaChange[] = [];

  const oldMap = createNameMap(oldIndexes, (idx) =>
    getIndexName(tableName, idx),
  );
  const newMap = createNameMap(newIndexes, (idx) =>
    getIndexName(tableName, idx),
  );

  // Added or changed
  for (const [name, newIdx] of newMap) {
    const oldIdx = oldMap.get(name);
    if (!oldIdx) {
      changes.push({
        type: "add_index",
        tableName,
        index: { ...newIdx, name },
        schema,
        priority: PRIORITY.ADD_INDEX,
      } as AddIndexChange);
    } else if (!indexesEqual(oldIdx, newIdx)) {
      changes.push({
        type: "drop_index",
        tableName,
        indexName: name,
        concurrently: oldIdx.concurrently,
        schema,
        priority: PRIORITY.DROP_INDEX,
      } as DropIndexChange);
      changes.push({
        type: "add_index",
        tableName,
        index: { ...newIdx, name },
        schema,
        priority: PRIORITY.READD_INDEX,
      } as AddIndexChange);
    }
  }

  // Removed
  for (const [name] of oldMap) {
    if (!newMap.has(name)) {
      changes.push({
        type: "drop_index",
        tableName,
        indexName: name,
        concurrently: oldMap.get(name)?.concurrently,
        schema,
        priority: PRIORITY.DROP_INDEX,
      } as DropIndexChange);
    }
  }

  return changes;
}
