import type { ColumnSchema } from "@damatjs/orm-type";
import type { AlterColumnChange } from "../types/diff";
import { isNativeVectorType, vectorManualReview } from "./vector";

export function columnAlteration(
  tableName: string,
  columnName: string,
  oldColumn: ColumnSchema,
  newColumn: ColumnSchema,
): {
  changes: AlterColumnChange["changes"];
  manualReview?: string;
} {
  const changes: AlterColumnChange["changes"] = {};
  if (oldColumn.type !== newColumn.type) {
    changes.type = { from: oldColumn.type, to: newColumn.type };
  }
  if (oldColumn.nullable !== newColumn.nullable) {
    changes.nullable = { from: oldColumn.nullable, to: newColumn.nullable };
  }
  if (oldColumn.default !== newColumn.default) {
    changes.default = { from: oldColumn.default, to: newColumn.default };
  }
  if (oldColumn.length !== newColumn.length) {
    changes.length = { from: oldColumn.length, to: newColumn.length };
  }
  if (oldColumn.dimensions !== newColumn.dimensions) {
    changes.dimensions = {
      from: oldColumn.dimensions,
      to: newColumn.dimensions,
    };
  }
  if (oldColumn.scale !== newColumn.scale) {
    changes.scale = { from: oldColumn.scale, to: newColumn.scale };
  }
  if (oldColumn.unique !== newColumn.unique) {
    changes.unique = { from: !!oldColumn.unique, to: !!newColumn.unique };
  }
  if (oldColumn.primaryKey !== newColumn.primaryKey) {
    changes.primaryKey = {
      from: !!oldColumn.primaryKey,
      to: !!newColumn.primaryKey,
    };
  }
  if (oldColumn.array !== newColumn.array) {
    changes.array = { from: !!oldColumn.array, to: !!newColumn.array };
  }

  const vectorChanged =
    (oldColumn.type !== newColumn.type ||
      oldColumn.dimensions !== newColumn.dimensions) &&
    (isNativeVectorType(oldColumn.type) || isNativeVectorType(newColumn.type));
  const manualReview = vectorChanged
    ? vectorManualReview(
        tableName,
        columnName,
        oldColumn.type,
        oldColumn.dimensions,
        newColumn.type,
        newColumn.dimensions,
      )
    : undefined;
  return { changes, ...(manualReview ? { manualReview } : {}) };
}
