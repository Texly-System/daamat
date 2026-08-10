import type { IndexSchema } from "@damatjs/orm-type";

export interface AddIndexChange {
  type: "add_index";
  tableName: string;
  index: IndexSchema;
  schema?: string | undefined;
  priority: number;
}

export interface DropIndexChange {
  type: "drop_index";
  tableName: string;
  indexName: string;
  concurrently?: boolean;
  schema?: string | undefined;
  priority: number;
}
