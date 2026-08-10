import type {
  ConstraintSchema,
  ForeignKeySchema,
} from "@damatjs/orm-type";

export interface AddForeignKeyChange {
  type: "add_foreign_key";
  tableName: string;
  foreignKey: ForeignKeySchema;
  schema?: string | undefined;
  priority: number;
}

export interface DropForeignKeyChange {
  type: "drop_foreign_key";
  tableName: string;
  constraintName: string;
  schema?: string | undefined;
  priority: number;
}

export interface AddConstraintChange {
  type: "add_constraint";
  tableName: string;
  constraint: ConstraintSchema;
  schema?: string | undefined;
  priority: number;
}

export interface DropConstraintChange {
  type: "drop_constraint";
  tableName: string;
  constraint: ConstraintSchema;
  schema?: string | undefined;
  priority: number;
}
