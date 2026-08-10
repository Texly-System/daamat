import type { ModuleSchema } from "@damatjs/orm-type";
import type { SchemaChange } from "../../types";
import { PRIORITY } from "../../diff/priority";
import { requiredExtensions } from "../../diff/extensions";

export function snapshotChanges(snapshot: ModuleSchema): SchemaChange[] {
  const changes: SchemaChange[] = [];
  for (const extension of requiredExtensions(snapshot)) {
    changes.push({
      type: "create_extension",
      extension,
      priority: PRIORITY.CREATE_EXTENSION,
    });
  }
  for (const enumDef of snapshot.enums ?? []) {
    changes.push({
      type: "create_enum",
      enumDef,
      schema: snapshot.schema ?? "public",
      priority: PRIORITY.CREATE_ENUM,
    });
  }
  for (const table of snapshot.tables) {
    const schema = table.schema ?? snapshot.schema ?? "public";
    changes.push({
      type: "create_table",
      tableName: table.name,
      table,
      schema,
      priority: PRIORITY.CREATE_TABLE,
    });
    for (const index of table.indexes ?? []) {
      changes.push({
        type: "add_index",
        tableName: table.name,
        index,
        schema,
        priority: PRIORITY.ADD_INDEX,
      });
    }
    for (const constraint of table.constraints ?? []) {
      changes.push({
        type: "add_constraint",
        tableName: table.name,
        constraint,
        schema,
        priority: PRIORITY.ADD_CONSTRAINT,
      });
    }
    for (const foreignKey of table.foreignKeys ?? []) {
      changes.push({
        type: "add_foreign_key",
        tableName: table.name,
        foreignKey,
        schema,
        priority: PRIORITY.ADD_FOREIGN_KEY,
      });
    }
  }
  return changes.sort((left, right) => left.priority - right.priority);
}
