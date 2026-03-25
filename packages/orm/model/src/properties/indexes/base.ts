import { cleanupIndexSchema } from "../../utils/cleanupIndex";
import { IndexSchema, IndexType, IndexColumn } from "@/types";

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

  /** Build concurrently (no table lock) */
  concurrently(): this {
    this._concurrently = true;
    return this;
  }

  /** Convert to IndexSchema */
  toSchema(tableName: string, indexNumber?: number): IndexSchema {
    if (!this._name || this._name === "") {
      this._name = `${tableName}_${this._columns.map((col) => col.name).join("_")}`;
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
      },
      indexNumber,
    );
  }
}
