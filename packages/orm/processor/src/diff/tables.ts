import type { TableSchema } from "@damatjs/orm-type";
import type {
  CreateTableChange,
  DropTableChange,
  SchemaChange,
} from "../types/diff";
import { PRIORITY } from "./priority";
import { diffColumns } from "./columns";
import { diffIndexes } from "./indexes";
import { diffForeignKeys } from "./foreignKeys";
import { diffConstraints } from "./constraints";

/** Diff a single table between two snapshots. */
export function diffTable(
  oldTable: Omit<TableSchema, "relations"> | undefined,
  newTable: Omit<TableSchema, "relations"> | undefined,
  oldDefaultSchema = "public",
  newDefaultSchema = "public",
): { changes: SchemaChange[]; warnings: string[] } {
  const changes: SchemaChange[] = [];
  const warnings: string[] = [];
  if (!oldTable && newTable) {
    const schema = newTable.schema ?? newDefaultSchema;
    changes.push({
      type: "create_table",
      tableName: newTable.name,
      table: newTable,
      schema,
      priority: PRIORITY.CREATE_TABLE,
    } as CreateTableChange);
    changes.push(
      ...diffIndexes(newTable.name, [], newTable.indexes ?? [], schema),
    );
    const constraints = diffConstraints(
      newTable.name,
      schema,
      [],
      newTable.constraints ?? [],
    );
    changes.push(...constraints.changes);
    warnings.push(...constraints.warnings);
    changes.push(
      ...diffForeignKeys(newTable.name, [], newTable.foreignKeys ?? [], schema),
    );
    return { changes, warnings };
  }
  if (oldTable && !newTable) {
    const schema = oldTable.schema ?? oldDefaultSchema;
    changes.push({
      type: "drop_table",
      tableName: oldTable.name,
      cascade: true,
      schema,
      priority: PRIORITY.DROP_TABLE,
    } as DropTableChange);
    warnings.push(
      `Dropping table '${oldTable.name}' will delete all data in it`,
    );
    return { changes, warnings };
  }

  if (oldTable && newTable) {
    const oldSchema = oldTable.schema ?? oldDefaultSchema;
    const schema = newTable.schema ?? newDefaultSchema;
    if (oldSchema !== schema) {
      throw new Error(
        `Changing table schema for '${oldTable.name}' is not supported`,
      );
    }
    changes.push(
      ...diffColumns(newTable.name, oldTable.columns, newTable.columns, schema),
    );
    changes.push(
      ...diffIndexes(
        newTable.name,
        oldTable.indexes ?? [],
        newTable.indexes ?? [],
        schema,
      ),
    );
    changes.push(
      ...diffForeignKeys(
        newTable.name,
        oldTable.foreignKeys ?? [],
        newTable.foreignKeys ?? [],
        schema,
      ),
    );
    const constraints = diffConstraints(
      newTable.name,
      schema,
      oldTable.constraints ?? [],
      newTable.constraints ?? [],
    );
    changes.push(...constraints.changes);
    warnings.push(...constraints.warnings);
  }

  return { changes, warnings };
}
