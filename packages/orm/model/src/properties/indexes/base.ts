import { cleanupIndexSchema } from "../../utils/cleanupIndex";
import { IndexSchema, IndexType, IndexColumn } from "@/types";

/**
 * Index builder for fluent API
 */
export class IndexBuilder {
  private _name?: string;
  private _columns: (string | IndexColumn)[] = [];
  private _unique: boolean = false;
  private _type: IndexType = "btree";
  private _where?: string;
  private _concurrently?: boolean;

  constructor(columns: (string | IndexColumn)[]) {
    this._columns = columns.map((col) =>
      typeof col === "string" ? { name: col } : col,
    );
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

  /** Set custom index name */
  name(indexName: string): this {
    this._name = indexName;
    return this;
  }

  /** Set concurrently */
  concurrently(): this {
    this._concurrently = true;
    return this;
  }

  /** Convert to IndexSchema */
  toSchema(tableName: string, indexNumber: number): IndexSchema {
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
      indexNumber
    );
  }
}
