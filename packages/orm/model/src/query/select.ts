import { ColumnSchema } from "@/types";
import {
  BuiltQuery,
  OrderByClause,
  OrderDirection,
  RawWhereClause,
  TableRef,
  WhereClause,
} from "./types";
import {
  assembleQuery,
  assertKnownColumnList,
  buildOrderByClause,
  buildWhereClause,
  buildTableRef,
  knownColumns,
  quoteIdent,
} from "./helpers";

// ─── SelectQueryBuilder ───────────────────────────────────────────────────────

/**
 * Fluent builder for `SELECT` queries.
 *
 * Constructed via `ModelDefinition.select(columns?)` — never directly.
 *
 * ### Example
 * ```ts
 * const q = UserSchema
 *   .select(["id", "email", "name"])
 *   .where({ verified: true, age: { gte: 18 } })
 *   .orderBy("name")
 *   .limit(20)
 *   .offset(40)
 *   .build();
 *
 * // q.sql    → SELECT "id","email","name" FROM "store"."user"
 * //            WHERE "verified" = $1 AND "age" >= $2
 * //            ORDER BY "name" ASC
 * //            LIMIT 20 OFFSET 40
 * // q.params → [true, 18]
 * ```
 *
 * ### WHERE operators
 * ```ts
 * .where({ status: { in: ["active", "pending"] } })
 * .where({ total: { gt: 0, lte: 1000 } })
 * .where({ notes: { isNull: true } })
 * .whereRaw({ sql: "created_at > now() - interval $1", params: ["30 days"] })
 * ```
 */
export class SelectQueryBuilder {
  private readonly _tableRef: TableRef;
  private readonly _knownCols: Set<string>;

  /** Selected column names — empty means SELECT * */
  private _select: string[] = [];
  private _whereClauses: WhereClause[] = [];
  private _rawWhereClauses: RawWhereClause[] = [];
  private _orderBy: OrderByClause[] = [];
  private _limit?: number;
  private _offset?: number;
  private _distinct: boolean = false;

  constructor(tableRef: TableRef, columns: ColumnSchema[]) {
    this._tableRef = tableRef;
    this._knownCols = knownColumns(columns);
  }

  // ─── Column selection ──────────────────────────────────────────────────────

  /**
   * Choose which columns to return.
   *
   * Every name is validated against the model's column list at call time.
   * Passing an empty array (or calling `.select()` without arguments) resets
   * to `SELECT *`.
   *
   * @example
   * ```ts
   * .select(["id", "email"])
   * ```
   */
  select(columns: string[]): this {
    assertKnownColumnList(columns, this._knownCols, "select");
    this._select = columns;
    return this;
  }

  // ─── WHERE ─────────────────────────────────────────────────────────────────

  /**
   * Add one or more equality / operator conditions (AND-ed together).
   *
   * All keys are validated against the model's column list at call time.
   *
   * @example
   * ```ts
   * .where({ email: "a@b.com" })
   * .where({ age: { gte: 18 }, status: "active" })
   * .where({ total: { between: [10, 100] } })
   * ```
   */
  where(clause: WhereClause): this {
    this._whereClauses.push(clause);
    return this;
  }

  /**
   * Add a raw SQL WHERE fragment.
   *
   * Parameters inside `sql` **must** be numbered from `$1` — they will be
   * automatically re-numbered to avoid clashes with other conditions.
   *
   * @example
   * ```ts
   * .whereRaw({ sql: "created_at > now() - interval $1", params: ["30 days"] })
   * .whereRaw({ sql: "lower(email) = lower($1)", params: [email] })
   * ```
   */
  whereRaw(clause: RawWhereClause): this {
    this._rawWhereClauses.push(clause);
    return this;
  }

  // ─── ORDER BY ──────────────────────────────────────────────────────────────

  /**
   * Add an ORDER BY clause.
   *
   * Can be called multiple times; clauses are appended in order.
   *
   * @example
   * ```ts
   * .orderBy("created_at", "DESC")
   * .orderBy("name", "ASC", "NULLS LAST")
   * ```
   */
  orderBy(
    column: string,
    direction?: OrderDirection,
    nulls?: "NULLS FIRST" | "NULLS LAST",
  ): this {
    assertKnownColumnList([column], this._knownCols, "orderBy");
    const clause: OrderByClause = { column };
    if (direction !== undefined) clause.direction = direction;
    if (nulls !== undefined) clause.nulls = nulls;
    this._orderBy.push(clause);
    return this;
  }

  // ─── LIMIT / OFFSET ────────────────────────────────────────────────────────

  /**
   * Limit the number of returned rows.
   *
   * @example `.limit(10)`
   */
  limit(n: number): this {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(`[query:limit] Must be a non-negative integer, got ${n}`);
    }
    this._limit = n;
    return this;
  }

  /**
   * Skip the first N rows.
   *
   * @example `.offset(20)`
   */
  offset(n: number): this {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(
        `[query:offset] Must be a non-negative integer, got ${n}`,
      );
    }
    this._offset = n;
    return this;
  }

  // ─── DISTINCT ──────────────────────────────────────────────────────────────

  /**
   * Add `DISTINCT` to the SELECT.
   *
   * @example `.distinct()`
   */
  distinct(): this {
    this._distinct = true;
    return this;
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  /**
   * Compile the builder state into a `{ sql, params }` object.
   *
   * @example
   * ```ts
   * const { sql, params } = UserSchema.select(["id"]).where({ id: "usr_1" }).build();
   * ```
   */
  build(): BuiltQuery {
    const params: unknown[] = [];

    // SELECT clause
    const selectKeyword = this._distinct ? "SELECT DISTINCT" : "SELECT";
    const colList =
      this._select.length > 0 ? this._select.map(quoteIdent).join(", ") : "*";
    const selectClause = `${selectKeyword} ${colList}`;

    // FROM clause
    const fromClause = `FROM ${buildTableRef(this._tableRef)}`;

    // WHERE clause
    const whereClause = buildWhereClause(
      this._whereClauses,
      this._rawWhereClauses,
      params,
      this._knownCols,
    );

    // ORDER BY
    const orderByClause = buildOrderByClause(this._orderBy);

    // LIMIT / OFFSET
    const limitClause = this._limit !== undefined ? `LIMIT ${this._limit}` : "";
    const offsetClause =
      this._offset !== undefined ? `OFFSET ${this._offset}` : "";

    return assembleQuery(
      [
        selectClause,
        fromClause,
        whereClause,
        orderByClause,
        limitClause,
        offsetClause,
      ],
      params,
    );
  }
}
