import { ColumnSchema, IndexSchema, ForeignKeySchema, RelationType } from "./";

/**
 * Relation schema for hasMany/hasOne relations (metadata only, no DB column)
 */
export interface RelationSchema {
  /** The property name on this model */
  name: string;
  /** The type of relation */
  type: RelationType;
  /** The target table name */
  targetTable: string;
  /** The property name on the target model that holds the belongsTo (optional) */
  mappedBy?: string;
}

/**
 * Complete table schema definition
 */
export interface TableSchema {
  /** Table name */
  name: string;
  /** Schema name (default: public) */
  schema?: string;
  /** Column definitions */
  columns: ColumnSchema[];
  /** Index definitions */
  indexes: IndexSchema[];
  /** Foreign key definitions */
  foreignKeys: ForeignKeySchema[];
  /** Primary key columns (composite keys supported) */
  primaryKey: PrimaryKeySchema;
  /** Relation metadata (hasMany/hasOne - no DB columns, used for validation and ORM) */
  relations: RelationSchema[];
}

export interface PrimaryKeySchema {
  name: string; // this is the index/constraint name in DB
  columns: string[];
}
