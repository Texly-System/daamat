import type { CreateExtensionChange, MigrationGeneratorOptions } from "../types";

const EXTENSION_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** Generate additive extension installation SQL. Extension drops are forbidden. */
export function generateCreateExtension(
  change: CreateExtensionChange,
  _options: MigrationGeneratorOptions,
): string {
  if (!EXTENSION_NAME.test(change.extension)) {
    throw new Error(`Invalid PostgreSQL extension name '${change.extension}'`);
  }
  return `CREATE EXTENSION IF NOT EXISTS ${change.extension}`;
}
