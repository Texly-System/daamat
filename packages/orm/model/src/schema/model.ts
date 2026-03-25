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
import { toPascalCase } from "@/utils/toPascalCase";

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
   *   - `BelongsToBuilder`  → FK column + ForeignKeySchema
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
        // Set property name so default FK column naming works
        propValue._setPropertyName(propName);

        // Create the FK column on this table
        const fkColName = propValue.getField();
        const colBuilder = propValue.toColumnBuilder();
        colBuilder._setName(fkColName);
        columns.push(colBuilder.toSchema());

        // Create the FK constraint
        foreignKeys.push(propValue.toForeignKeySchema(this._tableName));

        // If the relation is flagged as indexed, add an index entry
        if (propValue.isIndexed()) {
          indexes.push({ columns: [fkColName] });
        }
      } else if (
        propValue instanceof HasManyBuilder ||
        propValue instanceof HasOneBuilder
      ) {
        const rel: RelationSchema = {
          name: propName,
          type: propValue instanceof HasManyBuilder ? "hasMany" : "hasOne",
          targetTable: propValue.getTargetTable(),
        };
        const inv = propValue.getInverse();
        if (inv !== undefined) {
          rel.mappedBy = inv;
        }
        relations.push(rel);
      }
    }

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
        propValue._setPropertyName(propName);
        const fkColName = propValue.getField();
        const colBuilder = propValue.toColumnBuilder();
        colBuilder._setName(fkColName);
        lines.push(`  ${fkColName}: ${colBuilder.toTsType()};`);
      }
      // HasMany / HasOne are not row-level fields — intentionally omitted.
    }

    return `export interface ${name} {\n${lines.join("\n")}\n}`;
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
