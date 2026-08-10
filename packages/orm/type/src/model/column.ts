import type { ColumnType } from "./columnTypes";

export type { ColumnType } from "./columnTypes";

/** Column definition in a table schema. */
export interface ColumnSchema {
  name: string;
  type: ColumnType;
  primaryKey?: boolean;
  length?: number;
  dimensions?: number;
  scale?: number;
  nullable: boolean;
  default?: any;
  unique?: boolean;
  enum?: string;
  array?: boolean;
  fieldName?: string;
  autoincrement?: boolean;
  numericRepresentation?: "number" | "string";
}
