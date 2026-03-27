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

// ─── InsertQueryBuilder ───────────────────────────────────────────────────────

/**
 * Fluent builder for `INSERT INTO … VALUES … RETURNING …` queries.
 *
 * Constructed via `ModelDefinition.insert()` — never directly.
 *
 * ### Single-row insert
 * ```ts
 * const q = OrderSchema
 *   .insert()
 *   .values({ id: "ord_1", total: 99.99, status: "pending" })
 *   .returning(["id", "total"])
 *   .build();
 *
 * // q.sql    → INSERT INTO "order" ("id","total","status")
 * //            VALUES ($1,$2,$3)
 * //            RETURNING "id","total"
 * // q.params → ["ord_1", 99.99, "pending"]
 * ```
 *
 * ### Bulk insert (multiple rows)
 * ```ts
 * const q = OrderSchema
 *   .insert()
 *   .values([
 *     { id: "ord_1", total: 10, status: "pending" },
 *     { id: "ord_2", total: 20, status: "confirmed" },
 *   ])
 *   .build();
 * ```
 *
 * ### ON CONFLICT DO NOTHING
 * ```ts
 * .onConflict({ action: "nothing" })
 * ```
 *
 * ### ON CONFLICT DO UPDATE (upsert)
 * ```ts
 * .onConflict({
 *   columns: ["email"],
 *   action: "update",
 *   set: { name: "new name" },
 * })
 * ```
 */
export class InsertQueryBuilder {
  private readonly _tableRef: TableRef;
  private readonly _knownCols: Set<string>;

  private _rows: ColumnValueMap[] = [];
  private _returning: string[] = [];
  private _onConflict?: OnConflictClause;

  constructor(tableRef: TableRef, columns: ColumnSchema[]) {
    this._tableRef = tableRef;
    this._knownCols = knownColumns(columns);
  }

  // ─── Values ────────────────────────────────────────────────────────────────

  /**
   * Provide the row(s) to insert.
   *
   * Every key is validated against the model's column list.  All rows must
   * share the same set of columns (the first row's keys define the column list).
   *
   * @example
   * ```ts
   * // single row
   * .values({ id: "ord_1", total: 99.99 })
   *
   * // multiple rows (bulk insert)
   * .values([
   *   { id: "ord_1", total: 99.99 },
   *   { id: "ord_2", total: 49.99 },
   * ])
   * ```
   */
  values(row: ColumnValueMap): this;
  values(rows: ColumnValueMap[]): this;
  values(input: ColumnValueMap | ColumnValueMap[]): this {
    const rows = Array.isArray(input) ? input : [input];
    if (rows.length === 0) return this;

    // Validate all rows
    for (const row of rows) {
      assertKnownColumns(row, this._knownCols, "insert.values");
    }

    this._rows = rows;
    return this;
  }

  // ─── RETURNING ─────────────────────────────────────────────────────────────

  /**
   * Specify which columns to return after the insert.
   *
   * Calling `.returning()` without arguments (or with an empty array) is
   * equivalent to `RETURNING *`.
   *
   * @example
   * ```ts
   * .returning(["id", "created_at"])
   * ```
   */
  returning(columns: string[] = []): this {
    assertKnownColumnList(columns, this._knownCols, "insert.returning");
    this._returning = columns;
    return this;
  }

  // ─── ON CONFLICT ───────────────────────────────────────────────────────────

  /**
   * Add an `ON CONFLICT` clause to the insert.
   *
   * @example
   * ```ts
   * // silently skip duplicate rows
   * .onConflict({ action: "nothing" })
   *
   * // upsert — update specific columns on conflict
   * .onConflict({
   *   columns: ["email"],
   *   action: "update",
   *   set: { name: "new name", updated_at: new Date() },
   * })
   * ```
   */
  onConflict(clause: OnConflictClause): this {
    if (clause.action === "update" && clause.set) {
      assertKnownColumns(clause.set, this._knownCols, "insert.onConflict.set");
    }
    if (clause.columns) {
      assertKnownColumnList(
        clause.columns,
        this._knownCols,
        "insert.onConflict.columns",
      );
    }
    this._onConflict = clause;
    return this;
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  /**
   * Compile the builder state into a `{ sql, params }` object.
   */
  build(): BuiltQuery {
    if (this._rows.length === 0) {
      throw new Error(
        "[query:insert] No values provided — call .values() before .build()",
      );
    }

    const params: unknown[] = [];
    const colNames = Object.keys(this._rows[0]!);
    const quotedCols = colNames.map(quoteIdent).join(", ");

    // Build per-row value tuples
    const valueTuples = this._rows.map((row) => {
      const placeholders = colNames.map((col) => {
        params.push(row[col]);
        return `$${params.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    const insertClause = `INSERT INTO ${buildTableRef(this._tableRef)} (${quotedCols})`;
    const valuesClause = `VALUES ${valueTuples.join(", ")}`;

    // ON CONFLICT
    let conflictClause = "";
    if (this._onConflict) {
      conflictClause = buildOnConflictClause(this._onConflict, params);
    }

    // RETURNING
    const returningClause =
      this._returning.length > 0 || this._onConflict?.action === "update"
        ? buildReturningClause(this._returning)
        : this._returning.length === 0 && this._rows.length > 0
          ? buildReturningClause([])
          : "";

    return assembleQuery(
      [insertClause, valuesClause, conflictClause, returningClause],
      params,
    );
  }
}

// ─── ON CONFLICT clause types ─────────────────────────────────────────────────

export type OnConflictAction = "nothing" | "update";

export interface OnConflictClause {
  /** Conflict target — the column(s) that define the unique constraint. */
  columns?: string[];
  /** What to do on conflict. */
  action: OnConflictAction;
  /**
   * When `action = "update"`: the columns to update with their new values.
   * Omit to update all inserted columns (using `EXCLUDED`).
   */
  set?: ColumnValueMap;
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function buildOnConflictClause(
  clause: OnConflictClause,
  params: unknown[],
): string {
  const target =
    clause.columns && clause.columns.length > 0
      ? `(${clause.columns.map(quoteIdent).join(", ")})`
      : "";

  if (clause.action === "nothing") {
    return `ON CONFLICT ${target} DO NOTHING`.trim();
  }

  // action === "update"
  let setFragments: string[];
  if (clause.set && Object.keys(clause.set).length > 0) {
    setFragments = Object.entries(clause.set).map(([col, val]) => {
      params.push(val);
      return `${quoteIdent(col)} = $${params.length}`;
    });
  } else {
    // No explicit set → use EXCLUDED (re-insert all columns)
    setFragments = [`${quoteIdent("id")} = EXCLUDED.${quoteIdent("id")}`];
  }

  return `ON CONFLICT ${target} DO UPDATE SET ${setFragments.join(", ")}`.trim();
}

// ─── Standalone INSERT builder ────────────────────────────────────────────────

// Re-export types for use in WHERE-filtered helpers
export type { WhereClause, RawWhereClause };
export { buildWhereClause };
