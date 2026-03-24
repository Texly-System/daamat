import type { ForeignKeySchema, ForeignKeyAction, ColumnType } from "@/types";
import type { BelongsToConfig } from "@/types/relation";
import {
  ColumnBuilder,
  TextColumnBuilder,
  UuidColumnBuilder,
  IntegerColumnBuilder,
} from "../column";
import { ForeignKeyBuilder } from "../foreignKeys/base";
import { Relation, ModelLike, Target } from "./base";

/**
 * TODO: This is better but still not what i have in mind so will need to redo 
 * this but before that i need to make model first so that the type inference 
 * is correct and the extraction is done right
**/

/**
 * BelongsTo - The owning side of a relationship
 *
 * Creates a FK column pointing to another table.
 *
 * Usage:
 * ```ts
 * const PostSchema = model('posts', {
 *   // Simple: author_id -> users.id
 *   author: belongsTo(UserSchema),
 *
 *   // With options:
 *   category: belongsTo(CategorySchema, {
 *     fields: 'category_id',
 *     references: 'id',
 *     onDelete: 'SET NULL',
 *     nullable: true
 *   }),
 *
 *   // Composite FK:
 *   product: belongsTo(ProductSchema, {
 *     fields: ['vendor_id', 'sku'],
 *     references: ['vendor_id', 'sku']
 *   })
 * })
 * ```
 */
export class BelongsTo<
  TModel extends ModelLike = ModelLike,
> extends Relation<TModel> {
  /** Explicit FK column name(s) */
  private _fields?: string[];

  /** Referenced columns on target (default: ['id']) */
  private _references: string[] = ["id"];

  /** FK column type */
  private _type?: ColumnType;

  /** FK column nullable */
  private _nullable = false;

  /** FK column unique (for 1:1) */
  private _unique = false;

  /** Create index on FK */
  private _indexed = false;

  /** Constraint name */
  private _constraintName?: string;

  /** ON DELETE */
  private _onDelete?: ForeignKeyAction;

  /** ON UPDATE */
  private _onUpdate?: ForeignKeyAction;

  /** Deferrable */
  private _deferrable = false;

  /** Initially deferred */
  private _initiallyDeferred = false;

  constructor(target: Target<TModel>, config?: BelongsToConfig) {
    super("belongsTo", target);

    if (config) {
      // Fields config
      if (config.fields) {
        this._fields = Array.isArray(config.fields)
          ? config.fields
          : [config.fields];
      }
      if (config.references) {
        this._references = Array.isArray(config.references)
          ? config.references
          : [config.references];
      }
      if (config.type) this._type = config.type;
      if (config.nullable) this._nullable = config.nullable;
      if (config.unique) this._unique = config.unique;
      if (config.indexed) this._indexed = config.indexed;

      // Constraint config
      if (config.constraintName) this._constraintName = config.constraintName;
      if (config.onDelete) this._onDelete = config.onDelete;
      if (config.onUpdate) this._onUpdate = config.onUpdate;
      if (config.deferrable) this._deferrable = config.deferrable;
      if (config.initiallyDeferred)
        this._initiallyDeferred = config.initiallyDeferred;

      // Inverse
      if (config.inverse) this._inverse = config.inverse;
    }
  }

  // ─── Fluent API: Fields ────────────────────────────────────────────

  /** Set FK column name(s) */
  fields(columns: string | string[]): this {
    this._fields = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  /** Set referenced column(s) on target */
  references(columns: string | string[]): this {
    this._references = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  /** Set FK column type */
  type(t: ColumnType): this {
    this._type = t;
    return this;
  }

  /** Mark FK as nullable */
  nullable(): this {
    this._nullable = true;
    return this;
  }

  /** Mark FK as unique (1:1 relationship) */
  unique(): this {
    this._unique = true;
    return this;
  }

  /** Create index on FK column */
  indexed(): this {
    this._indexed = true;
    return this;
  }

  // ─── Fluent API: Constraint ────────────────────────────────────────

  /** Set constraint name */
  constraint(name: string): this {
    this._constraintName = name;
    return this;
  }

  /** Set ON DELETE action */
  onDelete(action: ForeignKeyAction): this {
    this._onDelete = action;
    return this;
  }

  /** Set ON UPDATE action */
  onUpdate(action: ForeignKeyAction): this {
    this._onUpdate = action;
    return this;
  }

  /** Make constraint deferrable */
  deferrable(initially = false): this {
    this._deferrable = true;
    this._initiallyDeferred = initially;
    return this;
  }

  /** Set inverse property name */
  inverse(propertyName: string): this {
    this._inverse = propertyName;
    return this;
  }

  // ─── Getters ───────────────────────────────────────────────────────

  createsForeignKey(): boolean {
    return true;
  }

  /**
   * Get FK column names
   * Default: `<propertyName>_id`
   */
  getFields(): string[] {
    if (this._fields) return this._fields;
    if (this._propertyName) return [`${this._propertyName}_id`];
    return [`${this.getTargetTable()}_id`];
  }

  /** Get primary FK column */
  getField(): string {
    return this.getFields()[0]!;
  }

  /** Get referenced columns */
  getReferences(): string[] {
    return this._references;
  }

  isNullable(): boolean {
    return this._nullable;
  }

  isUnique(): boolean {
    return this._unique;
  }

  isIndexed(): boolean {
    return this._indexed;
  }

  // ─── Schema Generation ─────────────────────────────────────────────

  /**
   * Create ForeignKeyBuilder for this relation
   */
  toForeignKeyBuilder(sourceTable: string): ForeignKeyBuilder {
    const params: {
      sourceTable: string;
      relationName: string;
      targetTable: string;
      fields?: string | string[];
      references?: string | string[];
    } = {
      sourceTable,
      relationName: this._propertyName ?? "unknown",
      targetTable: this.getTargetTable(),
      references: this._references,
    };

    if (this._fields) {
      params.fields = this._fields;
    }

    const fk = ForeignKeyBuilder.fromRelation(params);

    // Constraint
    if (this._constraintName) fk.name(this._constraintName);
    if (this._onDelete) {
      fk.onDelete(this._onDelete);
    } else if (this._nullable) {
      fk.onDelete("SET NULL");
    }
    if (this._onUpdate) fk.onUpdate(this._onUpdate);
    if (this._deferrable) fk.deferrable(this._initiallyDeferred);

    // Column
    if (this._nullable) fk.nullable();
    if (this._unique) fk.unique();
    if (this._type) fk.columnType(this._type);
    if (this._indexed) fk.indexed();

    return fk;
  }

  /**
   * Create column builder for FK column
   */
  toColumnBuilder(): ColumnBuilder {
    const t = this._type ?? "text";

    let col: ColumnBuilder;
    switch (t) {
      case "uuid":
        col = new UuidColumnBuilder();
        break;
      case "integer":
      case "smallint":
      case "bigint":
        col = new IntegerColumnBuilder();
        break;
      default:
        col = new TextColumnBuilder();
    }

    if (this._nullable) col.nullable();
    if (this._unique) col.unique();

    return col;
  }

  /**
   * Generate FK schema
   */
  toForeignKeySchema(sourceTable: string): ForeignKeySchema {
    return this.toForeignKeyBuilder(sourceTable).toSchema();
  }
}

/**
 * Create a belongsTo relation
 */
export function belongsTo<TModel extends ModelLike>(
  target: Target<TModel>,
  config?: BelongsToConfig,
): BelongsTo<TModel> {
  return new BelongsTo(target, config);
}

// Keep old name for backwards compat
export { BelongsTo as BelongsToBuilder };
