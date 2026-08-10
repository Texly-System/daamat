import type { ColumnSchema, ColumnType } from "@damatjs/orm-type";

export interface AddColumnChange {
  type: "add_column";
  tableName: string;
  column: ColumnSchema;
  schema?: string | undefined;
  priority: number;
}

export interface DropColumnChange {
  type: "drop_column";
  tableName: string;
  columnName: string;
  schema?: string | undefined;
  priority: number;
}

export interface RenameColumnChange {
  type: "rename_column";
  tableName: string;
  fromName: string;
  toName: string;
  schema?: string | undefined;
  priority: number;
}

export interface AlterColumnChange {
  type: "alter_column";
  tableName: string;
  columnName: string;
  schema?: string | undefined;
  priority: number;
  changes: {
    type?: { from: ColumnType; to: ColumnType };
    nullable?: { from: boolean; to: boolean };
    default?: { from: string | undefined; to: string | undefined };
    length?: { from: number | undefined; to: number | undefined };
    dimensions?: { from: number | undefined; to: number | undefined };
    scale?: { from: number | undefined; to: number | undefined };
    unique?: { from: boolean; to: boolean };
    primaryKey?: { from: boolean; to: boolean };
    array?: { from: boolean; to: boolean };
  };
  manualReview?: string;
}
