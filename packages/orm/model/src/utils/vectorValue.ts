import type { ColumnSchema } from "@damatjs/orm-type";

/** A validated native pgvector value. */
export type VectorValue = number[];

/**
 * Assert the runtime shape required by VECTOR/HALFVEC columns.
 * Nullish values are intentionally handled by callers because nullable and
 * optional columns have different write semantics.
 */
export function assertVectorValue(
  value: unknown,
  dimensions: number,
  context = "vector",
): asserts value is VectorValue {
  if (!Number.isInteger(dimensions) || dimensions <= 0) {
    throw new RangeError(`${context} dimensions must be a positive integer`);
  }
  if (!Array.isArray(value)) {
    throw new TypeError(`${context} must be an array`);
  }
  if (value.length !== dimensions) {
    throw new RangeError(
      `${context} must contain exactly ${dimensions} values (received ${value.length})`,
    );
  }
  value.forEach((item, index) => {
    if (typeof item !== "number") {
      throw new TypeError(`${context}[${index}] must be a number`);
    }
    if (!Number.isFinite(item)) {
      throw new RangeError(`${context}[${index}] must be finite`);
    }
  });
}

/** Whether a schema column is one of Damat's native vector types. */
export function isVectorColumn(column: Pick<ColumnSchema, "type">): boolean {
  return column.type === "vector" || column.type === "halfvec";
}

/** Validate a non-nullish value when the supplied schema column is native vector. */
export function assertColumnVectorValue(
  column: Pick<ColumnSchema, "name" | "type" | "dimensions">,
  value: unknown,
): void {
  if (!isVectorColumn(column) || value === undefined || value === null) return;
  assertVectorValue(value, column.dimensions ?? 0, column.name);
}
