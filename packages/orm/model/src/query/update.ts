import { ColumnSchema } from "@/types";
import {
  BuiltQuery,
  ColumnValueMap,
  RawWhereClause,
  TableRef,
  WhereClause,
} from "./types";
import {
  assembleQuery,
  assertKnownColumns,
  assertKnownColumnList,
  buildReturningClause,
  buildTableRef,
  buildWhereClause,
  knownColumns,
  quoteIdent,
} from "./helpers";

// ─── UpdateQueryBuilder ───────────────────────────────────────────────────────

/**
 * Fluent builder for `UPDATE … SET … WHERE … RETURNING …` queries.
 *
 * Constructed via `ModelDefinition.update()` — never directly.
 *
 * ### Example
 * ```ts
 * const q = UserSchema
 *   .update()
 *   .set({ name: "Alice", verified: true })
 *   .where({ id: "usr_1" })
 *   .returning(["id", "name", "updated_at"])
 *   .build();
 *
 * // q.sql    → UPDATE "store"."user" SET "name" = $1, "verified" = $2
 * //            WHERE "id" = $3
 * //            RETURNING "id","name","updated_at"
 * // q.params → ["Alice", true, "usr_1"]
 * ```
 *
 * ### Raw WHERE
 * ```ts
 * .whereRaw({ sql: "lower(email) = lower($1)", params: [email] })
 * ```
 *
 * > **Safety**: calling `.build()` without any `.where()` / `.whereRaw()` clause
 * > will throw to prevent accidental full-table updates.  Use `.allowFullTable()`
 * > to opt-in when you genuinely need to update every row.
 */
export class UpdateQueryBuilder {
  private readonly _tableRef: TableRef;
  private readonly _knownCols: Set<string>;

  private _set: ColumnValueMap = {};
  private _whereClauses: WhereClause[] = [];
  private _rawWhereClauses: RawWhereClause[] = [];
  private _returning: string[] = [];
  private _allowFullTable: boolean = false;

  constructor(tableRef: TableRef, columns: ColumnSchema[]) {
    this._tableRef = tableRef;
    this._knownCols = knownColumns(columns);
  }

  // ─── SET ───────────────────────────────────────────────────────────────────

  /**
   * Provide the column → value pairs to update.
   *
   * All keys are validated against the model's column list.  Calling `.set()`
   * multiple times merges the values (later calls win on duplicate keys).
   *
   * @example
   * ```ts
   * .set({ name: "Alice", verified: true })
   * .set({ updated_at: new Date() })   // merged into the same SET clause
   * ```
   */
  set(values: ColumnValueMap): this {
    assertKnownColumns(values, this._knownCols, "update.set");
    this._set = { ...this._set, ...values };
    return this;
  }

  // ─── WHERE ─────────────────────────────────────────────────────────────────

  /**
   * Add object-style WHERE conditions (AND-ed together).
   *
   * @example
   * ```ts
   * .where({ id: "usr_1" })
   * .where({ status: { in: ["active", "pending"] } })
   * ```
   */
  where(clause: WhereClause): this {
    this._whereClauses.push(clause);
    return this;
  }

  /**
   * Add a raw SQL WHERE fragment.
   *
   * Parameters must be numbered from `$1` — they are re-numbered automatically
   * to avoid clashes with SET parameters.
   *
   * @example
   * ```ts
   * .whereRaw({ sql: "created_at < now() - interval $1", params: ["1 year"] })
   * ```
   */
  whereRaw(clause: RawWhereClause): this {
    this._rawWhereClauses.push(clause);
    return this;
  }

  // ─── RETURNING ─────────────────────────────────────────────────────────────

  /**
   * Specify which columns to return after the update.
   *
   * Calling without arguments is equivalent to `RETURNING *`.
   *
   * @example `.returning(["id", "updated_at"])`
   */
  returning(columns: string[] = []): this {
    assertKnownColumnList(columns, this._knownCols, "update.returning");
    this._returning = columns;
    return this;
  }

  // ─── Safety escape hatch ───────────────────────────────────────────────────

  /**
   * Allow building an `UPDATE` without a `WHERE` clause, affecting all rows.
   *
   * Use with care — this is intentionally opt-in.
   */
  allowFullTable(): this {
    this._allowFullTable = true;
    return this;
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  /**
   * Compile the builder state into a `{ sql, params }` object.
   */
  build(): BuiltQuery {
    if (Object.keys(this._set).length === 0) {
      throw new Error(
        "[query:update] No columns to update — call .set() before .build()",
      );
    }

    const hasWhere =
      this._whereClauses.length > 0 || this._rawWhereClauses.length > 0;

    if (!hasWhere && !this._allowFullTable) {
      throw new Error(
        "[query:update] No WHERE clause provided. " +
          "This would update every row. " +
          "Add a .where() condition or call .allowFullTable() to opt-in.",
      );
    }

    const params: unknown[] = [];

    // SET clause
    const setFragments = Object.entries(this._set).map(([col, val]) => {
      params.push(val);
      return `${quoteIdent(col)} = $${params.length}`;
    });
    const setClause = `SET ${setFragments.join(", ")}`;

    // UPDATE clause
    const updateClause = `UPDATE ${buildTableRef(this._tableRef)}`;

    // WHERE clause (params are appended after SET params)
    const whereClause = buildWhereClause(
      this._whereClauses,
      this._rawWhereClauses,
      params,
      this._knownCols,
    );

    // RETURNING
    const returningClause =
      this._returning.length >= 0 ? buildReturningClause(this._returning) : "";

    return assembleQuery(
      [updateClause, setClause, whereClause, returningClause],
      params,
    );
  }
}
