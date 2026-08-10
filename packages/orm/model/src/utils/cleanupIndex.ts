import { IndexColumn, IndexSchema } from "@/types";

/**
 * Convert user-friendly index definition to IndexSchema
 */
export function cleanupIndexSchema(
  tableName: string,
  index: IndexSchema,
  indexNumber?: number,
): IndexSchema {
  const columns: IndexColumn[] = index.columns.map((col) => {
    if (typeof col === "string") return { name: col };
    const result = "expression" in col
      ? { expression: col.expression }
      : { name: col.name };
    return {
      ...result,
      ...(col.operatorClass !== undefined
        ? { operatorClass: col.operatorClass }
        : {}),
      ...(col.order !== undefined ? { order: col.order } : {}),
    };
  });

  const hasExpression = columns.some((column) => "expression" in column);
  if (!index.name && hasExpression) {
    throw new Error("Expression indexes require an explicit name");
  }
  const columnNames = columns
    .map((column) => ("name" in column ? column.name : "expression"))
    .join("_");
  const uniquePrefix = index.unique ? "uniq_" : "idx_";
  let generatedName = `${uniquePrefix}${tableName}_${columnNames}`;
  if (indexNumber) generatedName = `${generatedName}_${indexNumber}`;

  const schema: IndexSchema = {
    name: index.name || generatedName,
    columns,
    unique: index.unique ?? false,
  };

  if (index.type !== undefined) {
    schema.type = index.type;
  }
  if (index.where !== undefined) {
    schema.where = index.where;
  }
  if (index.concurrently !== undefined) {
    schema.concurrently = index.concurrently;
  }
  if (index.with !== undefined) {
    schema.with = { ...index.with };
  }

  return schema;
}
