import type { TableSchema } from "@damatjs/orm-type";

export interface CreateTableChange {
  type: "create_table";
  tableName: string;
  table: Omit<TableSchema, "relations">;
  schema?: string | undefined;
  priority: number;
}

export interface DropTableChange {
  type: "drop_table";
  tableName: string;
  cascade: boolean;
  schema?: string | undefined;
  priority: number;
}

export interface RenameTableChange {
  type: "rename_table";
  fromName: string;
  toName: string;
  schema?: string | undefined;
  priority: number;
}
