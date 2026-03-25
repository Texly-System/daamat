import { ColumnBuilder } from "./base";

/**
 * JSON column builder
 * SQL types: json | jsonb
 */
export class JsonColumnBuilder extends ColumnBuilder {
  constructor(options?: { binary?: boolean }) {
    super(options?.binary ? "jsonb" : "json");
  }

  /** Use jsonb (binary JSON) for better indexing */
  binary(): this {
    this._type = "jsonb";
    return this;
  }
}
