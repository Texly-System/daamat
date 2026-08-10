import type { ColumnType } from "@damatjs/orm-type";

export function isNativeVectorType(type: ColumnType): boolean {
  return type === "vector" || type === "halfvec";
}

function vectorLabel(type: ColumnType, dimensions?: number): string {
  if (!isNativeVectorType(type)) return type.toUpperCase();
  return `${type === "halfvec" ? "HALFVEC" : "VECTOR"}(${dimensions ?? "?"})`;
}

export function vectorManualReview(
  tableName: string,
  columnName: string,
  fromType: ColumnType,
  fromDimensions: number | undefined,
  toType: ColumnType,
  toDimensions: number | undefined,
): string {
  return [
    `Native vector change for ${tableName}.${columnName} requires manual review`,
    `(${vectorLabel(fromType, fromDimensions)} → ${vectorLabel(toType, toDimensions)})`,
    ". No automatic cast was generated.",
  ].join(" ");
}
