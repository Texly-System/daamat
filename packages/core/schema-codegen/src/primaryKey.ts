import type { ColumnSchema, TableSchema } from "@damatjs/orm-type";

/**
 * Return the columns that make up a table's primary key.
 *
 * Column builders can mark a single column with `.primaryKey()`, while
 * composite keys are represented by a `primary_key` table constraint.  Keep
 * both representations in one place so type and CRUD generators agree about
 * which identity a table actually has.
 */
export function primaryKeyColumns(table: TableSchema): ColumnSchema[] {
  const constraint = table.constraints?.find(
    (entry) => entry.type === "primary_key",
  );
  if (constraint) {
    const columns = new Map(table.columns.map((column) => [column.name, column]));
    if (!constraint.columns.every((name) => columns.has(name))) return [];
    return constraint.columns.map((name) => columns.get(name)!);
  }
  return table.columns.filter((column) => column.primaryKey === true);
}
