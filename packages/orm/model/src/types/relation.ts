import { ForeignKeyAction } from './foreignKey';

/**
 * Relation type enumeration
 */
export type RelationType = "belongsTo" | "hasMany" | "hasOne";

/**
 * Options for belongsTo relation
 */
export interface BelongsToOptions {
  /** The foreign key column name */
  foreignKey?: string;
  /** The property name on the related model that maps back */
  mappedBy?: string;
}

/**
 * Options for hasMany/hasOne relation
 */
export interface HasManyOptions {
  /**
   * The property name on the related model that maps back.
   * If not provided, defaults to inferring from the owner table name.
   */
  mappedBy?: string;
}

/**
 * Relation definition stored in model
 */
export interface RelationDefinition {
  type: RelationType;
  /** Function that returns the related model name (for lazy evaluation) */
  target: () => string;
  /** Foreign key column name (for belongsTo) */
  foreignKey?: string;
  /** Mapped by property name */
  mappedBy?: string;
  /** Whether the relation is nullable */
  nullable: boolean;
  /** On delete action */
  onDelete?: ForeignKeyAction;
  /** On update action */
  onUpdate?: ForeignKeyAction;
}
