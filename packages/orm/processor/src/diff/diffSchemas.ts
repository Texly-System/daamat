import type { ModuleSchema } from "@damatjs/orm-type";
import type { SchemaDiff, SchemaChange } from "../types/diff";
import { createNameMap } from "./utils";
import { diffTable } from "./tables";
import { diffEnums } from "./enums";
import { diffExtensions } from "./extensions";

/**
 * Compare two ModuleSchemas and produce a full `SchemaDiff`.
 *
 * This is the primary entry point for the diff layer. Pass the schema
 * loaded from disk as `previous` and the schema built from live models
 * as `current`.
 *
 * Changes are sorted by priority so the SQL generator can emit them in
 * the correct dependency order (enums before tables, FKs after columns, etc.)
 */
export function diffSchemas(
  previous: ModuleSchema,
  current: ModuleSchema,
): SchemaDiff {
  const allChanges: SchemaChange[] = [];
  const allWarnings: string[] = [];

  // Extensions must precede enums and tables that may reference them.
  allChanges.push(...diffExtensions(previous, current));

  // Diff native enum types
  const { changes: enumChanges, warnings: enumWarnings } = diffEnums(
    previous.enums ?? [],
    current.enums ?? [],
    previous.schema ?? "public",
    current.schema ?? "public",
  );
  allChanges.push(...enumChanges);
  allWarnings.push(...enumWarnings);

  // Diff tables
  const oldMap = createNameMap(previous.tables);
  const newMap = createNameMap(current.tables);

  for (const tableName of new Set([...oldMap.keys(), ...newMap.keys()])) {
    const { changes, warnings } = diffTable(
      oldMap.get(tableName),
      newMap.get(tableName),
      previous.schema ?? "public",
      current.schema ?? "public",
    );
    allChanges.push(...changes);
    allWarnings.push(...warnings);
  }

  allChanges.sort((a, b) => a.priority - b.priority);

  for (const change of allChanges) {
    if (change.type === "alter_column" && change.manualReview) {
      allWarnings.push(change.manualReview);
    }
  }

  return {
    hasChanges: allChanges.length > 0,
    changes: allChanges,
    warnings: allWarnings,
  };
}
