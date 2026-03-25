import { ColumnBuilder } from "./base";

/**
 * Text column builder — variable-length character string (no length limit)
 */
export class TextColumnBuilder extends ColumnBuilder {
  constructor() {
    super("text");
  }
}

/**
 * Character varying column builder — variable-length character string with optional limit
 * SQL type: character varying [ (n) ]
 */
export class CharacterVaryingColumnBuilder extends ColumnBuilder {
  constructor(length?: number) {
    super("character varying");
    if (length !== undefined) {
      this._length = length;
    }
  }

  /** Set max length */
  length(len: number): this {
    this._length = len;
    return this;
  }
}

/**
 * Character column builder — fixed-length character string
 * SQL type: character [ (n) ]
 */
export class CharacterColumnBuilder extends ColumnBuilder {
  constructor(length?: number) {
    super("character");
    if (length !== undefined) {
      this._length = length;
    }
  }

  /** Set fixed length */
  length(len: number): this {
    this._length = len;
    return this;
  }
}
