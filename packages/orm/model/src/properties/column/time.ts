import { ColumnBuilder } from "./base";

/**
 * Timestamp column builder
 * SQL types: timestamp without time zone | timestamp with time zone
 */
export class TimestampColumnBuilder extends ColumnBuilder {
  constructor(options?: { withTimezone?: boolean }) {
    super(
      options?.withTimezone
        ? "timestamp with time zone"
        : "timestamp without time zone",
    );
  }

  /** Use timestamp with time zone */
  withTimezone(): this {
    this._type = "timestamp with time zone";
    return this;
  }

  /** Use timestamp without time zone */
  withoutTimezone(): this {
    this._type = "timestamp without time zone";
    return this;
  }

  /** Set default to current timestamp */
  defaultNow(): this {
    this._default = "now()";
    return this;
  }
}

/**
 * Date column builder
 * SQL type: date
 */
export class DateColumnBuilder extends ColumnBuilder {
  constructor() {
    super("date");
  }

  /** Set default to current date */
  defaultNow(): this {
    this._default = "CURRENT_DATE";
    return this;
  }
}

/**
 * Time column builder
 * SQL types: time without time zone | time with time zone
 */
export class TimeColumnBuilder extends ColumnBuilder {
  constructor(options?: { withTimezone?: boolean }) {
    super(
      options?.withTimezone ? "time with time zone" : "time without time zone",
    );
  }

  /** Use time with time zone */
  withTimezone(): this {
    this._type = "time with time zone";
    return this;
  }

  /** Use time without time zone */
  withoutTimezone(): this {
    this._type = "time without time zone";
    return this;
  }
}

/**
 * Interval column builder — time span
 * SQL type: interval [ fields ] [ (p) ]
 */
export class IntervalColumnBuilder extends ColumnBuilder {
  constructor() {
    super("interval");
  }
}
