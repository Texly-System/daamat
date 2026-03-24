import { ColumnType } from "./column";
import { ForeignKeyAction, ForeignKeySchemaMatch } from "./foreignKey";

/**
 * Relation types
 */
export type RelationType = "belongsTo" | "hasMany" | "hasOne";

/**
 * FK column configuration
 */
export interface FieldsConfig {
  /** Local FK column name(s) - defaults to `<propertyName>_id` */
  fields?: string | string[];

  /** Referenced column(s) on target - defaults to 'id' */
  references?: string | string[];

  /** Column type for FK column - defaults to 'text' */
  type?: ColumnType;

  /** Whether FK column allows NULL */
  nullable?: boolean;

  /** Whether FK column is unique (1:1 relation) */
  unique?: boolean;

  /** Create index on FK column */
  indexed?: boolean;
}

/**
 * FK constraint configuration
 */
export interface ConstraintConfig {
  /** Custom constraint name */
  constraintName?: string;

  /** ON DELETE action */
  onDelete?: ForeignKeyAction;

  /** ON UPDATE action */
  onUpdate?: ForeignKeyAction;

  /** Deferrable constraint */
  deferrable?: boolean;

  /** Initially deferred */
  initiallyDeferred?: boolean;

  /** Match type for composite FKs */
  match?: ForeignKeySchemaMatch;
}

/**
 * BelongsTo options - the owning side that creates FK
 */
export interface BelongsToConfig extends FieldsConfig, ConstraintConfig {
  /** Inverse property name on target model */
  inverse?: string;
}

/**
 * HasMany options - inverse side of 1:N
 */
export interface HasManyConfig {
  /** Property on target that holds the belongsTo */
  inverse?: string;
}

/**
 * HasOne options - inverse side of 1:1
 */
export interface HasOneConfig {
  /** Property on target that holds the belongsTo */
  inverse?: string;
}
