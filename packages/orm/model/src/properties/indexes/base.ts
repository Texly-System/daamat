import { cleanupIndexSchema } from "../../utils/cleanupIndex";
import {
  IndexColumn,
  IndexSchema,
  IndexType,
} from "@/types";

/**
 * Index builder for fluent API.
 *
 * Usage:
 * ```ts
 * indexBuilder("name_idx").columns([table.name]).unique()
 * indexBuilder("email_idx").columns(["email"]).unique().type("btree")
 * ```
 */
export class IndexBuilder {
  private _name: string;
  private _columns: IndexColumn[] = [];
  private _unique: boolean = false;
  private _type: IndexType = "btree";
  private _where?: string;
  private _concurrently?: boolean;
  private _with?: Record<string, string | number | boolean>;

  constructor(name?: string) {
    this._name = name || "";
  }

  /** Set the columns to index */
  columns(columns: (string | IndexColumn)[]): this {
    this._columns = columns.map((col) =>
      typeof col === "string" ? { name: col } : col,
    );
    return this;
  }

  /** Mark index as unique */
  unique(): this {
    this._unique = true;
    return this;
  }

  /** Set index type */
  type(indexType: IndexType): this {
    this._type = indexType;
    return this;
  }

  /** Set partial index WHERE clause */
  where(condition: string): this {
    this._where = condition;
    return this;
  }

  /** Set PostgreSQL index storage parameters. */
  with(parameters: Record<string, string | number | boolean>): this {
    this._with = { ...parameters };
    return this;
  }

  /** Build concurrently (no table lock) */
  concurrently(): this {
    this._concurrently = true;
    return this;
  }

  /** Convert to IndexSchema */
  toSchema(tableName: string, indexNumber?: number): IndexSchema {
    const hasExpression = this._columns.some((column) =>
      "expression" in column,
    );
    if (!this._name && !hasExpression) {
      this._name = `${tableName}_${this._columns
        .map((col) => ("name" in col ? col.name : ""))
        .join("_")}`;
    }
    return cleanupIndexSchema(
      tableName,
      {
        name: this._name,
        columns: this._columns,
        unique: this._unique,
        type: this._type,
        where: this._where,
        concurrently: this._concurrently,
        with: this._with,
      },
      indexNumber,
    );
  }
}
