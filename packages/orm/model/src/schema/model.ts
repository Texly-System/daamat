import { BooleanColumnBuilder } from "../properties/column/boolean";
import { ByteaColumnBuilder } from "../properties/column/bytea";
import {
  TextColumnBuilder,
  CharacterVaryingColumnBuilder,
} from "../properties/column/text";
import {
  DateColumnBuilder,
  TimeColumnBuilder,
  TimestampColumnBuilder,
} from "../properties/column/time";
import { EnumColumnBuilder } from "../properties/column/enum";
import { IdColumnBuilder } from "../properties/column/id";
import { JsonColumnBuilder } from "../properties/column/json";
import {
  IntegerColumnBuilder,
  NumericColumnBuilder,
} from "../properties/column/number";
import { UuidColumnBuilder } from "../properties/column/uuid";
import { BelongsToBuilder } from "../properties/relation/belongsToBuilder";
import { HasManyBuilder } from "../properties/relation/hasManyBuilder";
import { HasOneBuilder } from "../properties/relation/hasOneBuilder";
import { Target } from "../properties/relation/base";

function createLazyReference<T extends { _tableName: string }>(
  target: Target<T>,
): Target<T> {
  return target;
}
import { EnumBuilder } from "../properties/enum/base";
import {
  BelongsToConfig as BelongsToOptions,
  HasManyConfig as HasManyOptions,
  HasOneConfig as HasOneOptions,
  ModelDefinition,
  ModelProperties,
} from "@/types";

/**
 * The main model builder API - similar to @medusajs/framework/utils model
 */
export const model = {
  /**
   * Define a new model/table
   */
  define<T extends ModelProperties>(
    tableName: string,
    properties: T,
    options?: { schema?: string },
  ): ModelDefinition<T> {
    const definition: ModelDefinition<T> = {
      _tableName: tableName,
      _properties: properties,
      _indexes: [],
      indexes(indexes) {
        this._indexes = indexes;
        return this;
      },
      toTableSchema() {
        return {
          name: this._tableName,
          columns: [],
          indexes: [],
          foreignKeys: [],
          constraints: [],
          relations: [],
        };
      },
    };
    if (options?.schema) {
      definition._schemaName = options.schema;
    }
    return definition;
  },

  // Column type builders

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

  // Relation builders

  /**
   * Create a belongsTo relation (creates a foreign key column).
   *
   * Pass the target model directly or as a lazy arrow for circular references:
   *   - `model.belongsTo(UserSchema)`            — direct
   *   - `model.belongsTo(() => UserSchema)`       — lazy (no annotation needed)
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
   *   - `model.hasMany(OrderSchema, { mappedBy: 'user' })`
   *   - `model.hasMany(() => OrderSchema, { mappedBy: 'user' })`  — lazy
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
   *   - `model.hasOne(ProfileSchema, { mappedBy: 'account' })`
   *   - `model.hasOne(() => ProfileSchema, { mappedBy: 'account' })`  — lazy
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
};

export default model;
