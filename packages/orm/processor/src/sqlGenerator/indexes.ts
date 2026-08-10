import type { IndexSchema } from "@damatjs/orm-type";
import type {
  AddIndexChange,
  DropIndexChange,
  MigrationGeneratorOptions,
} from "../types";
import { quoteIdentifier, qualifiedTable, resolveSchema } from "./utils";
import {
  renderIndexColumn,
  renderStorageParams,
  resolvedIndexName,
} from "./indexFragments";

/** Build CREATE INDEX SQL for table creation and add-index changes. */
export function generateCreateIndex(
  index: IndexSchema,
  tableName: string,
  schema: string,
  options: MigrationGeneratorOptions,
): string {
  const fullTable = qualifiedTable(tableName, schema);
  const indexName = quoteIdentifier(resolvedIndexName(tableName, index));
  const columns = index.columns.map(renderIndexColumn).join(", ");
  const unique = index.unique ? " UNIQUE" : "";
  const concurrent = index.concurrently ? " CONCURRENTLY" : "";
  const guard = options.safeMode !== false ? " IF NOT EXISTS" : "";
  const using = index.type && index.type !== "btree"
    ? ` USING ${index.type.toUpperCase()}`
    : "";
  const storage = renderStorageParams(index.with);
  const where = index.where ? ` WHERE ${index.where}` : "";
  return `CREATE${unique} INDEX${concurrent}${guard} ${indexName} ON ${fullTable}${using} (${columns})${storage}${where}`;
}

/** Generate CREATE INDEX SQL from an add-index change. */
export function generateAddIndex(
  change: AddIndexChange,
  options: MigrationGeneratorOptions,
): string {
  const schema = resolveSchema(options, change.schema);
  return generateCreateIndex(change.index, change.tableName, schema, options);
}

/** Generate schema-qualified DROP INDEX SQL, preserving CONCURRENTLY. */
export function generateDropIndex(
  change: DropIndexChange,
  options: MigrationGeneratorOptions,
): string {
  const schema = resolveSchema(options, change.schema);
  const fullIndex = `${quoteIdentifier(schema)}.${quoteIdentifier(change.indexName)}`;
  const concurrent = change.concurrently ? " CONCURRENTLY" : "";
  const guard = options.safeMode !== false ? " IF EXISTS" : "";
  return `DROP INDEX${concurrent}${guard} ${fullIndex}`;
}
