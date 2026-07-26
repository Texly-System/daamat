import type {
  GeneratedMigration,
  MigrationGeneratorOptions,
  SchemaChange,
} from "../../types";
import type { ModuleSchema } from "@damatjs/orm-type";
import { generateChangeSQL } from "../changeSql";
import { PRIORITY } from "../../diff/priority";

// ─── shared defaults ──────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: MigrationGeneratorOptions = {
  cascadeDrops: false,
  safeMode: true,
};

function resolveOptions(
  options: MigrationGeneratorOptions,
): MigrationGeneratorOptions {
  return { ...DEFAULT_OPTIONS, ...options };
}

// ─── snapshot-based generator ─────────────────────────────────────────────────

/**
 * Generate UP SQL from a `ModuleSchema` alone — no diff required.
 *
 * Use this to produce a fresh baseline migration that creates the entire schema
 * from scratch.
 */
export function generateFromSnapshot(
  snapshot: ModuleSchema,
  options: MigrationGeneratorOptions = {},
): GeneratedMigration {
  const opts = resolveOptions(options);
  const upStatements: string[] = [];
  const warnings: string[] = [];

  // 1. Convert snapshot to SchemaChange[] with priorities
  const changes: SchemaChange[] = [];

  // Enums first (tables may reference them)
  if (snapshot.enums) {
    for (const enumDef of snapshot.enums) {
      changes.push({
        type: "create_enum",
        enumDef,
        schema: snapshot.schema ?? "public",
        priority: PRIORITY.CREATE_ENUM,
      });
    }
  }

  // Tables, indexes, and FKs
  for (const table of snapshot.tables) {
    // Create table (includes columns and inline PK)
    changes.push({
      type: "create_table",
      tableName: table.name,
      table: table as any,
      schema: table.schema ?? snapshot.schema ?? "public",
      priority: PRIORITY.CREATE_TABLE,
    });

    // Indexes
    if (table.indexes) {
      for (const index of table.indexes) {
        changes.push({
          type: "add_index",
          tableName: table.name,
          index,
          schema: table.schema ?? snapshot.schema ?? "public",
          priority: PRIORITY.ADD_INDEX,
        });
      }
    }

    if (table.constraints) {
      for (const constraint of table.constraints) {
        changes.push({
          type: "add_constraint",
          tableName: table.name,
          constraint,
          schema: table.schema ?? snapshot.schema ?? "public",
          priority: PRIORITY.ADD_CONSTRAINT,
        });
      }
    }

    // Foreign keys
    if (table.foreignKeys) {
      for (const fk of table.foreignKeys) {
        changes.push({
          type: "add_foreign_key",
          tableName: table.name,
          foreignKey: fk,
          schema: table.schema ?? snapshot.schema ?? "public",
          priority: PRIORITY.ADD_FOREIGN_KEY,
        });
      }
    }
  }

  // 2. Sort by priority (lower = first)
  changes.sort((a, b) => a.priority - b.priority);

  // 3. Generate SQL from sorted changes
  for (const change of changes) {
    upStatements.push(...generateChangeSQL(change, opts));
  }

  return {
    upStatements,
    description: `Baseline migration for module "${snapshot.moduleName}" (${snapshot.tables.length} table(s))`,
    warnings,
  };
}
