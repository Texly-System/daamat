import type { ColumnType } from "@/types";
import { PG_TYPE_TO_TS_BASE } from "./pgTypeToTsMap";

/** Map a PostgreSQL type to the node-postgres runtime TypeScript shape. */
export function pgTypeToTsBase(type: ColumnType): string {
  return PG_TYPE_TO_TS_BASE[type];
}

/** Map enum values to a TypeScript string-literal union. */
export function enumTypeToTsBase(enumValues?: string[]): string {
  return enumValues && enumValues.length > 0
    ? enumValues.map((value) => `'${value}'`).join(" | ")
    : "string";
}
