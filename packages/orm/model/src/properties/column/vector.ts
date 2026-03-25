import { ColumnBuilder } from "./base";
import { ColumnSchema } from "@/types";

/**
 * Vector column builder — stores a fixed-dimension vector as a real[] array.
 *
 * PostgreSQL representation: real[] (single-precision float array).
 * Dimension is encoded in the ColumnSchema via the `length` field and is
 * required so that application-level validation and DDL generation can enforce
 * the exact array size (e.g. ARRAY[1536] for OpenAI ada-002).
 *
 * Usage:
 *   vector(1536)            — 1536-dimensional vector (real[])
 *   vector(768).nullable()  — nullable 768-dim vector
 */
export class VectorColumnBuilder extends ColumnBuilder {
  private _dimensions: number;

  constructor(dimensions: number) {
    super("real");
    this._dimensions = dimensions;
    // Vectors are always stored as arrays
    this._array = true;
    // Record dimension in the length field
    this._length = dimensions;
  }

  /** Update the number of dimensions */
  dimensions(d: number): this {
    this._dimensions = d;
    this._length = d;
    return this;
  }

  toSchema(): ColumnSchema {
    const schema = super.toSchema();
    // Ensure length reflects current dimensions in case it was mutated
    schema.length = this._dimensions;
    return schema;
  }
}
