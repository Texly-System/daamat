import { BelongsToBuilder } from "./relation/belongsToBuilder";
import { HasManyBuilder } from "./relation/hasManyBuilder";
import { HasOneBuilder } from "./relation/hasOneBuilder";
import { Target } from "./relation/base";
import { BooleanColumnBuilder } from "./column/boolean";
import { ByteaColumnBuilder } from "./column/bytea";
import {
  TextColumnBuilder,
  CharacterVaryingColumnBuilder,
} from "./column/text";
import {
  DateColumnBuilder,
  TimeColumnBuilder,
  TimestampColumnBuilder,
} from "./column/time";
import { EnumColumnBuilder } from "./column/enum";
import { IdColumnBuilder } from "./column/id";
import { JsonColumnBuilder } from "./column/json";
import {
  IntegerColumnBuilder,
  NumericColumnBuilder,
} from "./column/number";
import { UuidColumnBuilder } from "./column/uuid";
import { EnumBuilder } from "./enum/base";
import {
  BelongsToConfig as BelongsToOptions,
  HasManyConfig as HasManyOptions,
  HasOneConfig as HasOneOptions,
} from "@/types";
import { IndexBuilder } from './indexes';
import { ConstraintBuilder } from './constraints';

function createLazyReference<T extends { _tableName: string }>(
  target: Target<T>,
): Target<T> {
  return target;
}

// Column and relation builders
export const columns = {
  /** Create an ID column (text with optional prefix for ID generation) */
  id(options?: { prefix?: string }): IdColumnBuilder {
    return new IdColumnBuilder(options);
  },

  /** Create a boolean column */
  boolean(): BooleanColumnBuilder {
    return new BooleanColumnBuilder();
  },

  /** Create a timestamp column */
  timestamp(options?: { withTimezone?: boolean }): TimestampColumnBuilder {
    return new TimestampColumnBuilder(options);
  },

  /** Create a date column */
  date(): DateColumnBuilder {
    return new DateColumnBuilder();
  },

  /** Create a time column */
  time(): TimeColumnBuilder {
    return new TimeColumnBuilder();
  },

  /** Create a JSON/JSONB column */
  json(options?: { binary?: boolean }): JsonColumnBuilder {
    return new JsonColumnBuilder(options);
  },

  /** Create text columns */
  text(): TextColumnBuilder {
    return new TextColumnBuilder();
  },

  /** Create character varying column */
  varchar(): CharacterVaryingColumnBuilder {
    return new CharacterVaryingColumnBuilder();
  },

  /** Create an enum column */
  enum(enumType: EnumBuilder): EnumColumnBuilder {
    return new EnumColumnBuilder(enumType);
  },

  /** Create a UUID column */
  uuid(): UuidColumnBuilder {
    return new UuidColumnBuilder();
  },

  /** Create a bytea (binary) column */
  bytea(): ByteaColumnBuilder {
    return new ByteaColumnBuilder();
  },

  /** Create an integer column */
  integer(): IntegerColumnBuilder {
    return new IntegerColumnBuilder();
  },

  /** Create a numeric column */
  numeric(precision?: number, scale?: number): NumericColumnBuilder {
    return new NumericColumnBuilder(precision, scale);
  },

  // Relation builders

  /**
   * Create a belongsTo relation (creates a foreign key column).
   *
   * Pass the target model directly or as a lazy arrow for circular references:
   *   - `columns.belongsTo(UserSchema)`            — direct
   *   - `columns.belongsTo(() => UserSchema)`       — lazy (no annotation needed)
   *
   * The returned builder is typed `BelongsToBuilder<T>` where `T` is the
   * target model's property map, inferred automatically.
   */
  belongsTo<R extends Target<{ _tableName: string }>>(
    target: R,
    options?: BelongsToOptions,
  ): BelongsToBuilder<any> {
    return new BelongsToBuilder<any>(createLazyReference(target), options);
  },

  /**
   * Create a hasMany relation (no column created - inverse side).
   *
   * Pass the target model directly or as a lazy arrow for circular references:
   *   - `columns.hasMany(OrderSchema, { mappedBy: 'user' })`
   *   - `columns.hasMany(() => OrderSchema, { mappedBy: 'user' })`  — lazy
   *
   * The returned builder is typed `HasManyBuilder<T>` where `T` is the
   * target model's property map, inferred automatically.
   */
  hasMany<R extends Target<{ _tableName: string }>>(
    target: R,
    options?: HasManyOptions,
  ): HasManyBuilder<any> {
    return new HasManyBuilder<any>(createLazyReference(target), options);
  },

  /**
   * Create a hasOne relation (no column created - inverse side).
   *
   * Pass the target model directly or as a lazy arrow for circular references:
   *   - `columns.hasOne(ProfileSchema, { mappedBy: 'account' })`
   *   - `columns.hasOne(() => ProfileSchema, { mappedBy: 'account' })`  — lazy
   *
   * The returned builder is typed `HasOneBuilder<T>` where `T` is the
   * target model's property map, inferred automatically.
   */
  hasOne<R extends Target<{ _tableName: string }>>(
    target: R,
    options?: HasOneOptions,
  ): HasOneBuilder<any> {
    return new HasOneBuilder<any>(createLazyReference(target), options);
  },
  indexes(name?: string): IndexBuilder {
    return new IndexBuilder(name);
  },
  constrains(name?: string): ConstraintBuilder {
    return new ConstraintBuilder(name);
  },
};
