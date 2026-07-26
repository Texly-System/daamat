import type {
  ColumnSchema,
  ColumnType,
  ForeignKeySchema,
  IndexSchema,
  TableSchema,
  EnumSchema,
  ConstraintSchema,
} from "@damatjs/orm-type";

// ─── tables ──────────────────────────────────────────────────────────────────

export interface CreateTableChange {
  type: "create_table";
  tableName: string;
  table: Omit<TableSchema, "relations">;
  schema?: string;
  priority: number;
}

export interface DropTableChange {
  type: "drop_table";
  tableName: string;
  cascade: boolean;
  schema?: string;
  priority: number;
}

export interface RenameTableChange {
  type: "rename_table";
  fromName: string;
  toName: string;
  schema?: string;
  priority: number;
}

// ─── columns ─────────────────────────────────────────────────────────────────

export interface AddColumnChange {
  type: "add_column";
  tableName: string;
  column: ColumnSchema;
  schema?: string;
  priority: number;
}

export interface DropColumnChange {
  type: "drop_column";
  tableName: string;
  columnName: string;
  schema?: string;
  priority: number;
}

export interface RenameColumnChange {
  type: "rename_column";
  tableName: string;
  fromName: string;
  toName: string;
  schema?: string;
  priority: number;
}

export interface AlterColumnChange {
  type: "alter_column";
  tableName: string;
  columnName: string;
  schema?: string;
  priority: number;
  changes: {
    type?: { from: ColumnType; to: ColumnType };
    nullable?: { from: boolean; to: boolean };
    default?: { from: string | undefined; to: string | undefined };
    length?: { from: number | undefined; to: number | undefined };
    scale?: { from: number | undefined; to: number | undefined };
    unique?: { from: boolean; to: boolean };
    primaryKey?: { from: boolean; to: boolean };
    array?: { from: boolean; to: boolean };
  };
}

// ─── indexes ─────────────────────────────────────────────────────────────────

export interface AddIndexChange {
  type: "add_index";
  tableName: string;
  index: IndexSchema;
  schema?: string;
  priority: number;
}

export interface DropIndexChange {
  type: "drop_index";
  tableName: string;
  indexName: string;
  schema?: string;
  priority: number;
}

// ─── foreign keys ─────────────────────────────────────────────────────────────

export interface AddForeignKeyChange {
  type: "add_foreign_key";
  tableName: string;
  foreignKey: ForeignKeySchema;
  schema?: string;
  priority: number;
}

export interface DropForeignKeyChange {
  type: "drop_foreign_key";
  tableName: string;
  constraintName: string;
  schema?: string;
  priority: number;
}

// ─── native enums ─────────────────────────────────────────────────────────────

export interface CreateEnumChange {
  type: "create_enum";
  enumDef: EnumSchema;
  schema?: string;
  priority: number;
}

export interface DropEnumChange {
  type: "drop_enum";
  enumName: string;
  schema?: string;
  priority: number;
}

export interface AlterEnumChange {
  type: "alter_enum";
  enumName: string;
  schema?: string;
  addValues?: string[];
  removeValues?: string[];
  priority: number;
}

export interface AddConstraintChange {
  type: "add_constraint";
  tableName: string;
  constraint: ConstraintSchema;
  schema?: string;
  priority: number;
}

export interface DropConstraintChange {
  type: "drop_constraint";
  tableName: string;
  constraint: ConstraintSchema;
  schema?: string;
  priority: number;
}

// ─── union ────────────────────────────────────────────────────────────────────

export type SchemaChange =
  | CreateTableChange
  | DropTableChange
  | RenameTableChange
  | AddColumnChange
  | DropColumnChange
  | RenameColumnChange
  | AlterColumnChange
  | AddIndexChange
  | DropIndexChange
  | AddForeignKeyChange
  | DropForeignKeyChange
  | AddConstraintChange
  | DropConstraintChange
  | CreateEnumChange
  | DropEnumChange
  | AlterEnumChange;
