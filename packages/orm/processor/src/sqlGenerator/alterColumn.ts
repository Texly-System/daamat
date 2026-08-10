import type { AlterColumnChange, MigrationGeneratorOptions } from "../types";
import { isNativeVectorType } from "../diff/vector";
import { quoteIdentifier, qualifiedTable, resolveSchema } from "./utils";

export function generateAlterColumnStatements(
  change: AlterColumnChange,
  options: MigrationGeneratorOptions,
): string[] {
  const schema = resolveSchema(options, change.schema);
  const table = qualifiedTable(change.tableName, schema);
  const column = quoteIdentifier(change.columnName);
  const statements: string[] = [];
  const { changes } = change;
  const vectorTypeChange =
    changes.type &&
    (isNativeVectorType(changes.type.from) ||
      isNativeVectorType(changes.type.to));

  if (vectorTypeChange || changes.dimensions) {
    statements.push(
      `-- MANUAL REVIEW: ${change.manualReview ?? "Native vector type or dimensions changed; provide an application-reviewed migration"}`,
    );
  } else if (changes.type) {
    const newType = changes.type.to.toUpperCase();
    statements.push(
      `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${newType} USING ${column}::${newType}`,
    );
  }
  if (changes.length && !changes.type && !changes.dimensions) {
    const length = changes.length.to;
    if (length != null) {
      statements.push(
        `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE VARCHAR(${length})`,
      );
    }
  }
  if (changes.nullable) {
    statements.push(
      changes.nullable.to
        ? `ALTER TABLE ${table} ALTER COLUMN ${column} DROP NOT NULL`
        : `ALTER TABLE ${table} ALTER COLUMN ${column} SET NOT NULL`,
    );
  }
  if (changes.default !== undefined) {
    statements.push(
      changes.default.to != null
        ? `ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT ${changes.default.to}`
        : `ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT`,
    );
  }
  appendConstraintChanges(statements, change, options, table, column);
  return statements;
}

function appendConstraintChanges(
  statements: string[],
  change: AlterColumnChange,
  options: MigrationGeneratorOptions,
  table: string,
  column: string,
): void {
  const { changes } = change;
  if (changes.unique) {
    const name = quoteIdentifier(`${change.tableName}_${change.columnName}_key`);
    statements.push(
      changes.unique.to
        ? `ALTER TABLE ${table} ADD CONSTRAINT ${name} UNIQUE (${column})`
        : `ALTER TABLE ${table} DROP CONSTRAINT${options.safeMode !== false ? " IF EXISTS" : ""} ${name}`,
    );
  }
  if (changes.primaryKey) {
    const name = quoteIdentifier(`${change.tableName}_pkey`);
    statements.push(
      changes.primaryKey.to
        ? `ALTER TABLE ${table} ADD CONSTRAINT ${name} PRIMARY KEY (${column})`
        : `ALTER TABLE ${table} DROP CONSTRAINT${options.safeMode !== false ? " IF EXISTS" : ""} ${name}`,
    );
  }
}
