import type { ModelDefinition } from "@damatjs/orm-model";
import type { QueryDescriptor } from "@damatjs/orm-type";
import { consumeWhereParams, toVectorSql } from "./vectorValues";
import { consumeRelationParams } from "./vectorRelations";

type Dimensions = Map<string, number>;
type Cursor = { value: number };

function consumeSet(
  values: Record<string, unknown>,
  params: unknown[],
  dimensions: Dimensions,
  cursor: Cursor,
): void {
  for (const [column, value] of Object.entries(values)) {
    const index = cursor.value++;
    if (dimensions.has(column) && value != null) {
      params[index] = toVectorSql(value, column, dimensions.get(column)!);
    }
  }
}

function consumeRows(
  rows: Record<string, unknown>[],
  params: unknown[],
  dimensions: Dimensions,
  cursor: Cursor,
): void {
  const columns = Object.keys(rows[0] ?? {});
  for (const row of rows) {
    for (const column of columns) {
      const value = row[column];
      const index = cursor.value++;
      if (dimensions.has(column) && value != null) {
        params[index] = toVectorSql(value, column, dimensions.get(column)!);
      }
    }
  }
}

export function serializeVectorParams(
  model: ModelDefinition,
  descriptor: QueryDescriptor,
  params: unknown[],
): unknown[] {
  const dimensions = new Map(
    model
      .toTableSchema()
      .columns.filter(
        (column) => column.type === "vector" || column.type === "halfvec",
      )
      .map((column) => [column.name, column.dimensions ?? 0]),
  );
  const cursor = { value: 0 };
  if (descriptor.type === "insert" || descriptor.type === "upsert") {
    consumeRows(descriptor.rows, params, dimensions, cursor);
    if (
      descriptor.type === "insert" &&
      descriptor.onConflict?.action === "update" &&
      descriptor.onConflict.set
    ) {
      consumeSet(descriptor.onConflict.set, params, dimensions, cursor);
    }
    if (descriptor.type === "upsert" && descriptor.set) {
      consumeSet(descriptor.set, params, dimensions, cursor);
    }
  } else if (descriptor.type === "update") {
    consumeSet(descriptor.set, params, dimensions, cursor);
    consumeWhereParams(descriptor.where, params, dimensions, cursor);
  } else {
    if (descriptor.type === "select") {
      consumeRelationParams(model, descriptor.with, params, cursor);
    }
    consumeWhereParams(descriptor.where, params, dimensions, cursor);
  }
  return params;
}
