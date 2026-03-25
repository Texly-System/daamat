import { ColumnBuilder } from "./base";

/**
 * Integer column builder
 * SQL types: smallint | integer | bigint | smallserial | serial | bigserial
 */
export class IntegerColumnBuilder extends ColumnBuilder {
  constructor() {
    super("integer");
  }

  /** Use bigint (8-byte signed integer) */
  bigInt(): this {
    this._type = "bigint";
    return this;
  }

  /** Use smallint (2-byte signed integer) */
  smallInt(): this {
    this._type = "smallint";
    return this;
  }

  /** Use smallserial (autoincrementing 2-byte integer) */
  smallSerial(): this {
    this._type = "smallserial";
    this._autoincrement = true;
    return this;
  }

  /** Use serial (autoincrementing 4-byte integer) */
  serial(): this {
    this._type = "serial";
    this._autoincrement = true;
    return this;
  }

  /** Use bigserial (autoincrementing 8-byte integer) */
  bigSerial(): this {
    this._type = "bigserial";
    this._autoincrement = true;
    return this;
  }
}

/**
 * Numeric/Decimal column builder — exact numeric of selectable precision
 * SQL type: numeric [ (p, s) ]  (decimal is an alias)
 */
export class NumericColumnBuilder extends ColumnBuilder {
  constructor(precision?: number, scale?: number) {
    super("numeric");
    if (precision !== undefined) {
      this._length = precision;
    }
    if (scale !== undefined) {
      this._scale = scale;
    }
  }

  /** Set precision (total significant digits) */
  precision(p: number): this {
    this._length = p;
    return this;
  }

  /** Set scale (digits after decimal point) */
  scale(s: number): this {
    this._scale = s;
    return this;
  }
}

/**
 * Real column builder — single precision floating-point (4 bytes)
 * SQL type: real
 */
export class RealColumnBuilder extends ColumnBuilder {
  constructor() {
    super("real");
  }
}

/**
 * Double precision column builder — double precision floating-point (8 bytes)
 * SQL type: double precision
 */
export class DoublePrecisionColumnBuilder extends ColumnBuilder {
  constructor() {
    super("double precision");
  }
}

/**
 * Money column builder — currency amount
 * SQL type: money
 */
export class MoneyColumnBuilder extends ColumnBuilder {
  constructor() {
    super("money");
  }
}
