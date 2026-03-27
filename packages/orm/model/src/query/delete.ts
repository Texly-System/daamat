import { ColumnSchema } from "@/types";
import { BuiltQuery, RawWhereClause, TableRef, WhereClause } from "./types";
import {
  assembleQuery,
  assertKnownColumnList,
  buildReturningClause,
  buildTableRef,
  buildWhereClause,
  knownColumns,
} from "./helpers";

// ─── DeleteQueryBuilder ───────────────────────────────────────────────────────

/**
 * Fluent builder for `DELETE FROM … WHERE … RETURNING …` queries.
 *
 * Constructed via `ModelDefinition.delete()` — never directly.
 *
 * ### Example
 * ```ts
 * const q = UserSchema
 *   .delete()
 *   .where({ id: "usr_1" })
 *   .returning(["id"])
 *   .build();
 *
 * // q.sql    → DELETE FROM "store"."user" WHERE "id" = $1 RETURNING "id"
 * // q.params → ["usr_1"]
 * ```
 *
 * ### Raw WHERE
 * ```ts
 * .whereRaw({ sql: "created_at < now() - interval $1", params: ["1 year"] })
 * ```
 *
 * > **Safety**: calling `.build()` without any `.where()` / `.whereRaw()` clause
 * > will throw to prevent accidental full-table deletes.  Use `.allowFullTable()`
 * > to opt-in when you genuinely want to truncate via DELETE.
 */
export class DeleteQueryBuilder {
  private readonly _tableRef: TableRef;
  private readonly _knownCols: Set<string>;

  private _whereClauses: WhereClause[] = [];
  private _rawWhereClauses: RawWhereClause[] = [];
  private _returning: string[] = [];
  private _allowFullTable: boolean = false;

  constructor(tableRef: TableRef, columns: ColumnSchema[]) {
    this._tableRef = tableRef;
    this._knownCols = knownColumns(columns);
  }

  // ─── WHERE ─────────────────────────────────────────────────────────────────

  /**
   * Add object-style WHERE conditions (AND-ed together).
   *
   * @example
   * ```ts
   * .where({ id: "usr_1" })
   * .where({ status: "inactive", age: { lt: 18 } })
   * ```
   */
  where(clause: WhereClause): this {
    this._whereClauses.push(clause);
    return this;
  }

  /**
   * Add a raw SQL WHERE fragment.
   *
   * Parameters must be numbered from `$1` — they are re-numbered automatically.
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
   * Specify which columns to return after the delete.
   *
   * Calling without arguments is equivalent to `RETURNING *`.
   *
   * @example `.returning(["id"])`
   */
  returning(columns: string[] = []): this {
    assertKnownColumnList(columns, this._knownCols, "delete.returning");
    this._returning = columns;
    return this;
  }

  // ─── Safety escape hatch ───────────────────────────────────────────────────

  /**
   * Allow building a `DELETE` without a `WHERE` clause, removing all rows.
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
    const hasWhere =
      this._whereClauses.length > 0 || this._rawWhereClauses.length > 0;

    if (!hasWhere && !this._allowFullTable) {
      throw new Error(
        "[query:delete] No WHERE clause provided. " +
          "This would delete every row. " +
          "Add a .where() condition or call .allowFullTable() to opt-in.",
      );
    }

    const params: unknown[] = [];

    // DELETE FROM clause
    const deleteClause = `DELETE FROM ${buildTableRef(this._tableRef)}`;

    // WHERE clause
    const whereClause = buildWhereClause(
      this._whereClauses,
      this._rawWhereClauses,
      params,
      this._knownCols,
    );

    // RETURNING
    const returningClause =
      this._returning.length >= 0 ? buildReturningClause(this._returning) : "";

    return assembleQuery([deleteClause, whereClause, returningClause], params);
  }
}
