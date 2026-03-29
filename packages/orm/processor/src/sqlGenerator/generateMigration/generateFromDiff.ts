import type {
  SchemaDiff,
  GeneratedMigration,
  MigrationGeneratorOptions,
} from "../../types";
import { generateChangeSQL, generateDescription } from "../changeSql";

// ─── shared defaults ──────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<MigrationGeneratorOptions> = {
  cascadeDrops: false,
  safeMode: true,
  schema: "public",
};

function resolveOptions(
  options: MigrationGeneratorOptions,
): Required<MigrationGeneratorOptions> {
  return { ...DEFAULT_OPTIONS, ...options };
}

// ─── diff-based generator ─────────────────────────────────────────────────────

/**
 * Generate UP SQL from a `SchemaDiff`.
 *
 * Use this when you have a previous snapshot and a current snapshot and have
 * already computed the diff between them via `diffSchemas`.
 *
 * Changes are already priority-sorted inside `SchemaDiff`, so UP statements
 * are emitted in dependency order (enums → tables → columns → indexes → FKs).
 */
export function generateFromDiff(
  diff: SchemaDiff,
  options: MigrationGeneratorOptions = {},
): GeneratedMigration {
  const opts = resolveOptions(options);
  const upStatements: string[] = [];

  for (const change of diff.changes) {
    upStatements.push(...generateChangeSQL(change, opts));
  }

  return {
    upStatements,
    description: generateDescription(diff),
    warnings: diff.warnings,
  };
}
