import { ColumnSchema } from "@/types";
import { ColumnBuilder } from "./base";

function requireDimensions(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Vector dimensions must be a positive integer");
  }
  return value;
}

abstract class NativeVectorColumnBuilder extends ColumnBuilder {
  private _dimensions: number;

  protected constructor(type: "vector" | "halfvec", dimensions: number) {
    super(type);
    this._dimensions = requireDimensions(dimensions);
  }

  /** Update the native vector dimensionality. */
  dimensions(value: number): this {
    this._dimensions = requireDimensions(value);
    return this;
  }

  /** Native vectors are scalar extension values, not PostgreSQL arrays. */
  override array(): never {
    throw new Error("Native vector columns cannot be converted to arrays");
  }

  override toSchema(): ColumnSchema {
    const schema = super.toSchema();
    schema.array = false;
    schema.dimensions = this._dimensions;
    delete schema.length;
    return schema;
  }
}

/** PostgreSQL VECTOR(dimensions), represented in TypeScript as number[]. */
export class VectorColumnBuilder extends NativeVectorColumnBuilder {
  constructor(dimensions: number) {
    super("vector", dimensions);
  }
}

/** PostgreSQL HALFVEC(dimensions), represented in TypeScript as number[]. */
export class HalfVectorColumnBuilder extends NativeVectorColumnBuilder {
  constructor(dimensions: number) {
    super("halfvec", dimensions);
  }
}
