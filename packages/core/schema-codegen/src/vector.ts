import type { ColumnSchema } from "@damatjs/orm-type";

export const isVectorType = (type: ColumnSchema["type"]): boolean =>
  type === "vector" || type === "halfvec";

export function vectorDimensions(column: ColumnSchema): number {
  if (!isVectorType(column.type)) {
    throw new Error(`Column "${column.name}" is not a native vector column`);
  }
  if (column.array) {
    throw new Error(
      `Native ${column.type} column "${column.name}" cannot be an array`,
    );
  }
  const dimensions = column.dimensions;
  if (
    typeof dimensions !== "number" ||
    !Number.isInteger(dimensions) ||
    dimensions <= 0
  ) {
    throw new Error(
      `Native ${column.type} column "${column.name}" requires a positive integer dimensions value`,
    );
  }
  return dimensions;
}
