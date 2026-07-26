import type {
  AlterEnumChange,
  CreateEnumChange,
  DropEnumChange,
  MigrationGeneratorOptions,
} from "../types";
import { qualifiedTable } from "./utils";

/**
 * Generate CREATE TYPE ... AS ENUM SQL.
 * PostgreSQL has no IF NOT EXISTS for CREATE TYPE, so safeMode uses a DO block.
 */
export function generateCreateEnum(
  change: CreateEnumChange,
  options: MigrationGeneratorOptions,
): string {
  const { enumDef } = change;
  const schema = enumDef.schema ?? options.schema ?? change.schema ?? "public";
  const typeName = qualifiedTable(enumDef.name, schema);
  const values = enumDef.values
    .map((v) => `'${v.replace(/'/g, "''")}'`)
    .join(", ");

  if (options.safeMode !== false) {
    return (
      `DO $$ BEGIN\n` +
      `  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumDef.name}') THEN\n` +
      `    CREATE TYPE ${typeName} AS ENUM (${values});\n` +
      `  END IF;\n` +
      `END $$`
    );
  }

  return `CREATE TYPE ${typeName} AS ENUM (${values})`;
}

/**
 * Generate DROP TYPE SQL.
 */
export function generateDropEnum(
  change: DropEnumChange,
  options: MigrationGeneratorOptions,
): string {
  const schema = options.schema ?? change.schema ?? "public";
  const typeName = qualifiedTable(change.enumName, schema);
  const ifExists = options.safeMode !== false ? " IF EXISTS" : "";
  const cascade = options.cascadeDrops ? " CASCADE" : "";
  return `DROP TYPE${ifExists} ${typeName}${cascade}`;
}

/**
 * Generate ALTER TYPE ... ADD VALUE statements.
 * Removing enum values in PostgreSQL requires recreating the type —
 * those are left as instructional comments here; the diff layer already
 * emits a warning when removal is detected.
 */
export function generateAlterEnum(
  change: AlterEnumChange,
  options: MigrationGeneratorOptions,
): string[] {
  const schema = options.schema ?? change.schema ?? "public";
  const typeName = qualifiedTable(change.enumName, schema);
  const stmts: string[] = [];

  for (const value of change.addValues ?? []) {
    stmts.push(
      `ALTER TYPE ${typeName} ADD VALUE IF NOT EXISTS '${value.replace(/'/g, "''")}'`,
    );
  }

  if (change.removeValues?.length) {
    throw new Error(
      `Removing enum values is unsupported: ${change.removeValues.join(", ")}`,
    );
  }

  return stmts;
}
