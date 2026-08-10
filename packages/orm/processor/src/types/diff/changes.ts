import type { AddColumnChange, AlterColumnChange, DropColumnChange, RenameColumnChange } from "./changes/column";
import type { CreateEnumChange, DropEnumChange, AlterEnumChange } from "./changes/enums";
import type { CreateExtensionChange } from "./changes/extensions";
import type { AddIndexChange, DropIndexChange } from "./changes/index";
import type { AddConstraintChange, DropConstraintChange, AddForeignKeyChange, DropForeignKeyChange } from "./changes/relations";
import type { CreateTableChange, DropTableChange, RenameTableChange } from "./changes/table";

export type * from "./changes/column";
export type * from "./changes/enums";
export type * from "./changes/extensions";
export type * from "./changes/index";
export type * from "./changes/relations";
export type * from "./changes/table";

export type SchemaChange =
  | CreateExtensionChange
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
