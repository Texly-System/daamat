import type { EnumSchema } from "@damatjs/orm-type";

export interface CreateEnumChange {
  type: "create_enum";
  enumDef: EnumSchema;
  schema?: string | undefined;
  priority: number;
}

export interface DropEnumChange {
  type: "drop_enum";
  enumName: string;
  schema?: string | undefined;
  priority: number;
}

export interface AlterEnumChange {
  type: "alter_enum";
  enumName: string;
  schema?: string | undefined;
  addValues?: string[];
  removeValues?: string[];
  priority: number;
}
