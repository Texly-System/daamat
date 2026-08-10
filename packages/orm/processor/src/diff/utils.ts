import type {
  ColumnSchema,
  ForeignKeySchema,
  IndexSchema,
  EnumSchema,
} from "@damatjs/orm-type";
import { isNativeVectorType } from "./vector";

/**
 * Build a lookup map keyed by `name` from any array of named items.
 */
export function createNameMap<T>(
  items: T[],
  getName: (item: T) => string = (item: any) => item.name,
): Map<string, T> {
  return new Map(items.map((item) => [getName(item), item]));
}

/**
 * Check if two columns are structurally equal.
 */
export function columnsEqual(a: ColumnSchema, b: ColumnSchema): boolean {
  const vector = isNativeVectorType(a.type) || isNativeVectorType(b.type);
  return (
    a.type === b.type &&
    a.nullable === b.nullable &&
    a.primaryKey === b.primaryKey &&
    a.unique === b.unique &&
    (vector || a.length === b.length) &&
    a.dimensions === b.dimensions &&
    a.scale === b.scale &&
    a.default === b.default &&
    a.array === b.array &&
    a.enum === b.enum
  );
}

/**
 * Check if two indexes are structurally equal.
 */
export function indexesEqual(a: IndexSchema, b: IndexSchema): boolean {
  return (
    a.unique === b.unique &&
    a.type === b.type &&
    a.where === b.where &&
    a.concurrently === b.concurrently &&
    JSON.stringify(a.columns) === JSON.stringify(b.columns) &&
    JSON.stringify(a.with) === JSON.stringify(b.with)
  );
}

/**
 * Check if two foreign keys are structurally equal.
 */
export function foreignKeysEqual(
  a: ForeignKeySchema,
  b: ForeignKeySchema,
): boolean {
  return (
    a.referencedTable === b.referencedTable &&
    a.referencedSchema === b.referencedSchema &&
    a.onDelete === b.onDelete &&
    a.onUpdate === b.onUpdate &&
    a.deferrable === b.deferrable &&
    a.match === b.match &&
    JSON.stringify(a.columns) === JSON.stringify(b.columns) &&
    JSON.stringify(a.referencedColumns) === JSON.stringify(b.referencedColumns)
  );
}

/**
 * Check if two native enums are structurally equal (order-insensitive).
 */
export function nativeEnumsEqual(a: EnumSchema, b: EnumSchema): boolean {
  return (
    a.schema === b.schema &&
    JSON.stringify(a.values.slice().sort()) ===
      JSON.stringify(b.values.slice().sort())
  );
}
