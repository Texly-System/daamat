import type {
  GeneratedMigration,
  MigrationGeneratorOptions,
} from "../../types";
import type { ModuleSchema } from "@damatjs/orm-type";
import { generateChangeSQL } from "../changeSql";
import { snapshotChanges } from "./snapshotChanges";

const DEFAULT_OPTIONS: MigrationGeneratorOptions = {
  cascadeDrops: false,
  safeMode: true,
};

function resolveOptions(
  options: MigrationGeneratorOptions,
): MigrationGeneratorOptions {
  return { ...DEFAULT_OPTIONS, ...options };
}

/** Generate a full baseline migration from a module schema. */
export function generateFromSnapshot(
  snapshot: ModuleSchema,
  options: MigrationGeneratorOptions = {},
): GeneratedMigration {
  const opts = resolveOptions(options);
  const upStatements: string[] = [];
  for (const change of snapshotChanges(snapshot)) {
    upStatements.push(...generateChangeSQL(change, opts));
  }
  return {
    upStatements,
    description: `Baseline migration for module "${snapshot.moduleName}" (${snapshot.tables.length} table(s))`,
    warnings: [],
  };
}
