import type {
  AddColumnChange,
  AlterColumnChange,
  DropColumnChange,
  RenameColumnChange,
  MigrationGeneratorOptions,
} from "../types";
import {
  quoteIdentifier,
  qualifiedTable,
  resolveSchema,
  columnDefinitionSql,
} from "./utils";
import { generateAlterColumnStatements } from "./alterColumn";

export function generateAddColumn(
  change: AddColumnChange,
  options: MigrationGeneratorOptions,
): string {
  const schema = resolveSchema(options, change.schema);
  return `ALTER TABLE ${qualifiedTable(change.tableName, schema)} ADD COLUMN ${columnDefinitionSql(change.column)}`;
}

export function generateDropColumn(
  change: DropColumnChange,
  options: MigrationGeneratorOptions,
): string {
  const schema = resolveSchema(options, change.schema);
  const table = qualifiedTable(change.tableName, schema);
  const column = quoteIdentifier(change.columnName);
  const guard = options.safeMode !== false ? " IF EXISTS" : "";
  const cascade = options.cascadeDrops ? " CASCADE" : "";
  return `ALTER TABLE ${table} DROP COLUMN${guard} ${column}${cascade}`;
}

export function generateAlterColumn(
  change: AlterColumnChange,
  options: MigrationGeneratorOptions,
): string[] {
  return generateAlterColumnStatements(change, options);
}

export function generateRenameColumn(
  change: RenameColumnChange,
  options: MigrationGeneratorOptions,
): string {
  const schema = resolveSchema(options, change.schema);
  return `ALTER TABLE ${qualifiedTable(change.tableName, schema)} RENAME COLUMN ${quoteIdentifier(change.fromName)} TO ${quoteIdentifier(change.toName)}`;
}
