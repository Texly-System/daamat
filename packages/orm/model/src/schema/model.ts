import {
  PropertyValue,
  ConstraintSchema,
  TableSchema,
  ColumnSchema,
  ForeignKeySchema,
  RelationSchema,
} from "@/types";
import { IndexSchema } from "@/types/indexType";
import { ColumnBuilder } from "@/properties/column/base";
import { BelongsToBuilder } from "@/properties/relation/belongsToBuilder";
import { HasManyBuilder } from "@/properties/relation/hasManyBuilder";
import { HasOneBuilder } from "@/properties/relation/hasOneBuilder";
import { IndexBuilder } from "@/properties/indexes/base";
import { ConstraintBuilder } from "@/properties/constraints/base";
import { toPascalCase } from "@/utils/stringConvertor";
import { SelectQueryBuilder } from "@/query/select";
import { InsertQueryBuilder } from "@/query/insert";
import { UpdateQueryBuilder } from "@/query/update";
import { DeleteQueryBuilder } from "@/query/delete";
import { TableRef } from "@/query/types";

// ─── ModelDefinition class ────────────────────────────────────────────────────

/**
 * The result of calling `model(...)`.
 *
 * Holds all builder-phase state and exposes:
 *   - `.constrain(constraints)` – fluent, returns `this`
 *   - `.indexes(indexes)`       – fluent, returns `this`
 *   - `.toTableSchema()`        – produces the final `TableSchema`
 *   - `.toTsType(typeName?)`    – produces a TypeScript interface string
 *
 * Both `.indexes()` and `.constrain()` accept either builder instances
 * (`IndexBuilder` / `ConstraintBuilder`) or plain schema objects — they are
 * normalised internally so call-sites never need to call `.toSchema()` manually.
 *
 * ```ts
 * model("users", { ... })
 *   .indexes([
 *     indexBuilder("users_name_idx").columns(["name"]).unique(),
 *   ])
 *   .constrain([
 *     constrainBuilder("users_email_uniq").columns(["email"]).unique(),
 *   ]);
 * ```
 */
export class ModelDefinition {
  readonly _tableName: string;
  _schemaName?: string;
  readonly _properties: Record<string, PropertyValue>;
  _indexes: IndexSchema[] = [];
  _constraints: ConstraintSchema[] = [];

  constructor(
    tableName: string,
    properties: Record<string, PropertyValue>,
    options?: { schema?: string },
  ) {
    this._tableName = tableName;
    this._properties = properties;
    if (options?.schema) {
      this._schemaName = options.schema;
    }
  }

  /**
   * Add (or replace) index definitions — fluent.
   *
   * Accepts either `IndexBuilder` instances or plain `IndexSchema` objects.
   * `IndexBuilder` instances are resolved via `.toSchema()` automatically.
   *
   * ```ts
   * .indexes([
   *   indexBuilder("users_email_idx").columns(["email"]).unique(),
   *   indexBuilder("users_name_idx").columns(["name"]).type("btree"),
   * ])
   * ```
   */
  indexes(indexes: IndexBuilder[]): this {
    this._indexes = indexes.map((entry, i) =>
      entry.toSchema(this._tableName, i + 1),
    );
    return this;
  }

  /**
   * Add (or replace) constraint definitions — fluent.
   *
   * Accepts either `ConstraintBuilder` instances or plain `ConstraintSchema` objects.
   * `ConstraintBuilder` instances are resolved via `.toSchema()` automatically.
   *
   * ```ts
   * .constrain([
   *   constrainBuilder("users_email_uniq").columns(["email"]).unique(),
   *   constrainBuilder("users_pkey").columns(["id"]).primaryKey(),
   * ])
   * ```
   */
  constrain(constraints: ConstraintBuilder[]): this {
    this._constraints = constraints.map((entry) => entry.toSchema());
    return this;
  }

  // ─── toTableSchema ──────────────────────────────────────────────────────────

  /**
   * Convert this model definition into a `TableSchema`.
   *
   * Iterates every property:
   *   - `ColumnBuilder`     → column + optional PK tracking
   *   - `BelongsToBuilder`  → FK column(s) + ForeignKeySchema + RelationSchema
   *   - `HasManyBuilder`    → RelationSchema (no DB column)
   *   - `HasOneBuilder`     → RelationSchema (no DB column)
   */
  toTableSchema(): TableSchema {
    const columns: ColumnSchema[] = [];
    const foreignKeys: ForeignKeySchema[] = [];
    const relations: RelationSchema[] = [];
    // Start with a copy so we don't mutate _indexes when appending FK indexes
    const indexes: IndexSchema[] = [...this._indexes];

    for (const [propName, propValue] of Object.entries(this._properties)) {
      if (propValue instanceof ColumnBuilder) {
        propValue._setName(propName);
        columns.push(propValue.toSchema());
      } else if (propValue instanceof BelongsToBuilder) {
        // Create the FK column(s) on this table — toColumnBuilder() returns an
        // array (one builder per FK column, supporting composite FKs).
        const fkKeys = propValue.getForeignKey();
        const colSchemas = propValue.toColumnSchema();
        columns.push(...colSchemas);

        // Create the FK constraint
        foreignKeys.push(propValue.toForeignKeySchema());

        // Module-level relation metadata — from = this table name
        relations.push(propValue.toRelationSchema(this._tableName));

        // If the relation is flagged as indexed, add an index entry per FK col
        if (propValue.isIndexed()) {
          for (const fkKey of fkKeys) {
            indexes.push({ columns: [fkKey.name] });
          }
        }
      } else if (
        propValue instanceof HasManyBuilder ||
        propValue instanceof HasOneBuilder
      ) {
        // from = this table name, not the property name
        relations.push(propValue.toRelationSchema(this._tableName));
      }
    }

    columns.push({
      name: "created_at",
      type: "date",
      nullable: false,
      default: "now()",
      primaryKey: false,
      unique: false,
    });

    columns.push({
      name: "updated_at",
      type: "date",
      nullable: true,
      primaryKey: false,
      unique: false,
    });

    const schema: TableSchema & { schema?: string } = {
      name: this._tableName,
      columns,
      indexes,
      foreignKeys,
      constraints: this._constraints,
      relations,
    };

    if (this._schemaName !== undefined) {
      schema.schema = this._schemaName;
    }

    return schema;
  }

  // ─── toTsType ───────────────────────────────────────────────────────────────
  /**
   * Generate a TypeScript interface string that represents the row shape of
   * this model.
   *
   * - Regular columns map to their `.toTsType()` output.
   * - `belongsTo` relations appear as the FK column (e.g. `user_id: string`).
   * - `hasMany` / `hasOne` are runtime-loaded collections and are omitted.
   *
   * @param typeName  Name for the generated interface.  Defaults to a
   *                  PascalCase derivation of the table name.
   *
   * Example output:
   * ```ts
   * export interface Order {
   *   id: string;
   *   total: number;
   *   status: orders;
   *   notes: string | null;
   *   placedAt: Date;
   * }
   * ```
   */
  toTsType(typeName?: string): string {
    const name = typeName ?? toPascalCase(this._tableName);
    const lines: string[] = [];

    for (const [propName, propValue] of Object.entries(this._properties)) {
      if (propValue instanceof ColumnBuilder) {
        propValue._setName(propName);
        lines.push(`  ${propName}: ${propValue.toTsType()};`);
      } else if (propValue instanceof BelongsToBuilder) {
        // Emit one TS field per FK column (supports composite FKs)
        const fkKeys = propValue.getForeignKey();
        const colBuilders = propValue.toColumnBuilder();
        for (let i = 0; i < colBuilders.length; i++) {
          const colName = fkKeys[i]!.name;
          colBuilders[i]!._setName(colName);
          lines.push(`  ${colName}: ${colBuilders[i]!.toTsType()};`);
        }
      }
      // HasMany / HasOne are not row-level fields — intentionally omitted.
    }

    return `export interface ${name} {\n${lines.join("\n")}\n}`;
  }

  // ─── Private helper ──────────────────────────────────────────────────────────

  /**
   * Build the `TableRef` used by all query builders.
   * Resolves the table + optional schema name without triggering a full
   * `toTableSchema()` traversal.
   */
  private _tableRef(): TableRef {
    const ref: TableRef = { name: this._tableName };
    if (this._schemaName !== undefined) ref.schema = this._schemaName;
    return ref;
  }

  /**
   * Resolve the full `ColumnSchema[]` for this model (including auto-columns).
   * Used internally by query builders for column validation.
   */
  private _resolvedColumns(): ColumnSchema[] {
    return this.toTableSchema().columns;
  }

  // ─── Query factory methods ────────────────────────────────────────────────────

  /**
   * Start a `SELECT` query against this model's table.
   *
   * Optionally pass the column names to return up-front — every name is
   * validated against the schema.  Omit to start with `SELECT *` (can be
   * narrowed later with `.select(columns)`).
   *
   * ```ts
   * UserSchema.select(["id", "email"])
   *   .where({ verified: true })
   *   .orderBy("name", "ASC")
   *   .limit(10)
   *   .build();
   * ```
   */
  select(columns: string[] = []): SelectQueryBuilder {
    const builder = new SelectQueryBuilder(
      this._tableRef(),
      this._resolvedColumns(),
    );
    if (columns.length > 0) builder.select(columns);
    return builder;
  }

  /**
   * Start an `INSERT INTO` query against this model's table.
   *
   * ```ts
   * UserSchema.insert()
   *   .values({ id: "usr_1", email: "a@b.com", name: "Alice" })
   *   .returning(["id"])
   *   .build();
   * ```
   */
  insert(): InsertQueryBuilder {
    return new InsertQueryBuilder(this._tableRef(), this._resolvedColumns());
  }

  /**
   * Start an `UPDATE … SET` query against this model's table.
   *
   * ```ts
   * UserSchema.update()
   *   .set({ name: "Bob", verified: true })
   *   .where({ id: "usr_1" })
   *   .returning(["id", "name"])
   *   .build();
   * ```
   */
  update(): UpdateQueryBuilder {
    return new UpdateQueryBuilder(this._tableRef(), this._resolvedColumns());
  }

  /**
   * Start a `DELETE FROM` query against this model's table.
   *
   * ```ts
   * UserSchema.delete()
   *   .where({ id: "usr_1" })
   *   .returning(["id"])
   *   .build();
   * ```
   */
  delete(): DeleteQueryBuilder {
    return new DeleteQueryBuilder(this._tableRef(), this._resolvedColumns());
  }
}

// ─── Public factory function ──────────────────────────────────────────────────

/**
 * Define a new model / table.
 *
 * ```ts
 * export const UserSchema = model("users", {
 *   id:    columns.id({ prefix: "usr" }).primaryKey(),
 *   name:  columns.varchar(100),
 *   email: columns.text(),
 * })
 *   .indexes([
 *     indexBuilder("users_email_idx").columns(["email"]).unique(),
 *   ])
 *   .constrain([
 *     constrainBuilder("users_name_uniq").columns(["name"]).unique(),
 *   ]);
 * ```
 */
export function model(
  tableName: string,
  properties: Record<string, PropertyValue>,
  options?: { schema?: string },
): ModelDefinition {
  return new ModelDefinition(tableName, properties, options);
}

export default model;
