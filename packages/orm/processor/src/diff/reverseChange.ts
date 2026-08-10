import type { SchemaChange } from "../types/diff";
import { PRIORITY } from "./priority";
import { reverseAlter } from "./reverseAlter";

/** Invert one reversible schema change; destructive drops remain skipped. */
export function reverseChange(change: SchemaChange): SchemaChange | undefined {
  switch (change.type) {
    case "create_extension":
    case "drop_table":
    case "drop_column":
    case "drop_index":
    case "drop_foreign_key":
    case "drop_enum":
    case "drop_constraint":
    case "rename_table":
    case "rename_column":
      return undefined;
    case "create_table":
      return {
        type: "drop_table",
        tableName: change.table.name,
        cascade: true,
        schema: change.schema,
        priority: PRIORITY.DROP_TABLE,
      };
    case "add_column":
      return {
        type: "drop_column",
        tableName: change.tableName,
        columnName: change.column.name,
        schema: change.schema,
        priority: PRIORITY.DROP_COLUMN,
      };
    case "alter_column":
      return reverseAlter(change);
    case "add_index":
      return {
        type: "drop_index",
        tableName: change.tableName,
        indexName: change.index.name!,
        ...(change.index.concurrently !== undefined
          ? { concurrently: change.index.concurrently }
          : {}),
        schema: change.schema,
        priority: PRIORITY.DROP_INDEX,
      };
    case "add_foreign_key":
      return {
        type: "drop_foreign_key",
        tableName: change.tableName,
        constraintName: change.foreignKey.name,
        schema: change.schema,
        priority: PRIORITY.DROP_FOREIGN_KEY,
      };
    case "create_enum":
      return {
        type: "drop_enum",
        enumName: change.enumDef.name,
        schema: change.schema,
        priority: PRIORITY.DROP_ENUM,
      };
    case "alter_enum":
      return {
        type: "alter_enum",
        enumName: change.enumName,
        schema: change.schema,
        ...(change.removeValues ? { addValues: change.removeValues } : {}),
        ...(change.addValues ? { removeValues: change.addValues } : {}),
        priority: PRIORITY.ALTER_ENUM,
      };
    case "add_constraint":
      return {
        type: "drop_constraint",
        tableName: change.tableName,
        constraint: change.constraint,
        schema: change.schema,
        priority: PRIORITY.DROP_CONSTRAINT,
      };
  }
}
