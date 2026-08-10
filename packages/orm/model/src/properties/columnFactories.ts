import { EnumBuilder } from "./enum/base";
import { BooleanColumnBuilder } from "./column/boolean";
import { ByteaColumnBuilder } from "./column/bytea";
import { EnumColumnBuilder } from "./column/enum";
import { IdColumnBuilder } from "./column/id";
import { JsonColumnBuilder } from "./column/json";
import {
  DoublePrecisionColumnBuilder,
  IntegerColumnBuilder,
  MoneyColumnBuilder,
  NumericColumnBuilder,
  RealColumnBuilder,
} from "./column/number";
import {
  CharacterColumnBuilder,
  CharacterVaryingColumnBuilder,
  TextColumnBuilder,
} from "./column/text";
import {
  DateColumnBuilder,
  IntervalColumnBuilder,
  TimeColumnBuilder,
  TimestampColumnBuilder,
} from "./column/time";
import { HalfVectorColumnBuilder, VectorColumnBuilder } from "./column/vector";
import { UuidColumnBuilder } from "./column/uuid";

export const primitiveColumns = {
  id: (options?: { prefix?: string }) => new IdColumnBuilder(options),
  boolean: () => new BooleanColumnBuilder(),
  timestamp: (options?: { withTimezone?: boolean }) =>
    new TimestampColumnBuilder(options),
  date: () => new DateColumnBuilder(),
  time: () => new TimeColumnBuilder(),
  json: (options?: { binary?: boolean }) => new JsonColumnBuilder(options),
  text: () => new TextColumnBuilder(),
  varchar: (length?: number) => {
    const builder = new CharacterVaryingColumnBuilder();
    if (length !== undefined) builder.length(length);
    return builder;
  },
  char: (length?: number) => {
    const builder = new CharacterColumnBuilder();
    if (length !== undefined) builder.length(length);
    return builder;
  },
  enum: (enumType: EnumBuilder) => new EnumColumnBuilder(enumType),
  uuid: () => new UuidColumnBuilder(),
  bytea: () => new ByteaColumnBuilder(),
  integer: () => new IntegerColumnBuilder(),
  numeric: (precision?: number, scale?: number) =>
    new NumericColumnBuilder(precision, scale),
  real: () => new RealColumnBuilder(),
  doublePrecision: () => new DoublePrecisionColumnBuilder(),
  money: () => new MoneyColumnBuilder(),
  jsonb: () => new JsonColumnBuilder({ binary: true }),
  interval: () => new IntervalColumnBuilder(),
  vector: (dimensions: number) => new VectorColumnBuilder(dimensions),
  halfVector: (dimensions: number) => new HalfVectorColumnBuilder(dimensions),
};
