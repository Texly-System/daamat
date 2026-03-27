import { ColumnSchema } from "@/types";
import {
  BuiltQuery,
  OrderByClause,
  RawWhereClause,
  TableRef,
  WhereClause,
  WhereConditionValue,
  WhereOperators,
} from "./types";

// ─── Table identifier quoting ─────────────────────────────────────────────────

/**
 * Quote a single SQL identifier (schema name, table name, column name) with
 * double-quotes, escaping any embedded double-quotes.
 */
export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Build the fully-qualified table reference string, e.g.:
 *   `"store"."user"`  when schema is set
 *   `"user"`          otherwise
 */
export function buildTableRef(ref: TableRef): string {
  return ref.schema
    ? `${quoteIdent(ref.schema)}.${quoteIdent(ref.name)}`
    : quoteIdent(ref.name);
}

// ─── Column validation ────────────────────────────────────────────────────────

/**
 * Return the set of known column names for a table (as a plain `Set<string>`).
 * Always includes the auto-injected `created_at` and `updated_at` columns.
 */
export function knownColumns(columns: ColumnSchema[]): Set<string> {
  return new Set(columns.map((c) => c.name));
}

/**
 * Assert that every key in `obj` is a known column name.
 * Throws a descriptive `Error` at runtime when an unknown column is referenced.
 */
export function assertKnownColumns(
  obj: Record<string, unknown>,
  columns: Set<string>,
  context: string,
): void {
  for (const key of Object.keys(obj)) {
    if (!columns.has(key)) {
      throw new Error(
        `[query:${context}] Unknown column "${key}". ` +
          `Known columns: ${[...columns].join(", ")}`,
      );
    }
  }
}

/**
 * Assert that every name in `names` is a known column.
 */
export function assertKnownColumnList(
  names: string[],
  columns: Set<string>,
  context: string,
): void {
  for (const name of names) {
    if (!columns.has(name)) {
      throw new Error(
        `[query:${context}] Unknown column "${name}". ` +
          `Known columns: ${[...columns].join(", ")}`,
      );
    }
  }
}

// ─── WHERE builder ────────────────────────────────────────────────────────────

/** Return true when `v` is a WhereOperators object (vs. a plain scalar). */
function isOperatorObject(v: WhereConditionValue): v is WhereOperators {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
  const keys = Object.keys(v as object);
  const ops = new Set([
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "in",
    "notIn",
    "isNull",
    "isNotNull",
    "between",
  ]);
  return keys.length > 0 && keys.every((k) => ops.has(k));
}

/**
 * Compile a single WHERE condition for one column name + value pair.
 *
 * @param col    - quoted column identifier string
 * @param val    - raw value or WhereOperators object
 * @param params - mutable params array — values are pushed here
 * @returns SQL fragment string (using $N placeholders)
 */
function compileCondition(
  col: string,
  val: WhereConditionValue,
  params: unknown[],
): string {
  // Plain scalar → equality
  if (!isOperatorObject(val)) {
    if (val === null) {
      return `${col} IS NULL`;
    }
    params.push(val);
    return `${col} = $${params.length}`;
  }

  const op = val as Record<string, unknown>;
  const parts: string[] = [];

  if ("eq" in op) {
    if (op.eq === null) {
      parts.push(`${col} IS NULL`);
    } else {
      params.push(op.eq);
      parts.push(`${col} = $${params.length}`);
    }
  }
  if ("neq" in op) {
    if (op.neq === null) {
      parts.push(`${col} IS NOT NULL`);
    } else {
      params.push(op.neq);
      parts.push(`${col} <> $${params.length}`);
    }
  }
  if ("gt" in op) {
    params.push(op.gt);
    parts.push(`${col} > $${params.length}`);
  }
  if ("gte" in op) {
    params.push(op.gte);
    parts.push(`${col} >= $${params.length}`);
  }
  if ("lt" in op) {
    params.push(op.lt);
    parts.push(`${col} < $${params.length}`);
  }
  if ("lte" in op) {
    params.push(op.lte);
    parts.push(`${col} <= $${params.length}`);
  }
  if ("like" in op) {
    params.push(op.like);
    parts.push(`${col} LIKE $${params.length}`);
  }
  if ("ilike" in op) {
    params.push(op.ilike);
    parts.push(`${col} ILIKE $${params.length}`);
  }
  if ("in" in op) {
    const arr = op.in as unknown[];
    if (arr.length === 0) {
      // IN () is always false — use a safe literal
      parts.push(`FALSE`);
    } else {
      const placeholders = arr.map((v) => {
        params.push(v);
        return `$${params.length}`;
      });
      parts.push(`${col} IN (${placeholders.join(", ")})`);
    }
  }
  if ("notIn" in op) {
    const arr = op.notIn as unknown[];
    if (arr.length === 0) {
      // NOT IN () is always true
      parts.push(`TRUE`);
    } else {
      const placeholders = arr.map((v) => {
        params.push(v);
        return `$${params.length}`;
      });
      parts.push(`${col} NOT IN (${placeholders.join(", ")})`);
    }
  }
  if ("isNull" in op) {
    parts.push(`${col} IS NULL`);
  }
  if ("isNotNull" in op) {
    parts.push(`${col} IS NOT NULL`);
  }
  if ("between" in op) {
    const [lo, hi] = op.between as [unknown, unknown];
    params.push(lo);
    const loIdx = params.length;
    params.push(hi);
    const hiIdx = params.length;
    parts.push(`${col} BETWEEN $${loIdx} AND $${hiIdx}`);
  }

  return parts.join(" AND ");
}

/**
 * Build the WHERE clause SQL fragment and populate `params`.
 *
 * Combines object-style clauses (AND-ed together) with raw SQL fragments.
 * Returns an empty string when there are no conditions.
 *
 * @param whereClauses  - array of object-style WHERE clauses
 * @param rawClauses    - array of raw SQL fragments
 * @param params        - mutable params array (values pushed onto it)
 * @param knownCols     - known column names (for validation)
 * @returns SQL string, e.g. `WHERE "email" = $1 AND "age" > $2`
 */
export function buildWhereClause(
  whereClauses: WhereClause[],
  rawClauses: RawWhereClause[],
  params: unknown[],
  knownCols: Set<string>,
): string {
  const fragments: string[] = [];

  for (const clause of whereClauses) {
    assertKnownColumns(clause, knownCols, "where");
    for (const [col, val] of Object.entries(clause)) {
      const quotedCol = quoteIdent(col);
      fragments.push(compileCondition(quotedCol, val, params));
    }
  }

  for (const raw of rawClauses) {
    // Re-number raw $N placeholders so they continue from where params left off
    const offset = params.length;
    const reNumbered = raw.sql.replace(/\$(\d+)/g, (_match, n) => {
      return `$${parseInt(n, 10) + offset}`;
    });
    if (raw.params) {
      params.push(...raw.params);
    }
    fragments.push(reNumbered);
  }

  if (fragments.length === 0) return "";
  return `WHERE ${fragments.join(" AND ")}`;
}

// ─── ORDER BY builder ─────────────────────────────────────────────────────────

/**
 * Build the ORDER BY clause SQL fragment.
 * Returns an empty string when `clauses` is empty.
 */
export function buildOrderByClause(clauses: OrderByClause[]): string {
  if (clauses.length === 0) return "";
  const parts = clauses.map((c) => {
    let s = quoteIdent(c.column);
    if (c.direction) s += ` ${c.direction}`;
    if (c.nulls) s += ` ${c.nulls}`;
    return s;
  });
  return `ORDER BY ${parts.join(", ")}`;
}

// ─── RETURNING builder ────────────────────────────────────────────────────────

/**
 * Build a `RETURNING` clause from an array of column names.
 * Returns `RETURNING *` when `cols` is empty.
 */
export function buildReturningClause(cols: string[]): string {
  if (cols.length === 0) return "RETURNING *";
  return `RETURNING ${cols.map(quoteIdent).join(", ")}`;
}

// ─── Query assembler ──────────────────────────────────────────────────────────

/**
 * Join a list of SQL parts (some of which may be empty strings), remove the
 * empty ones, and join with a single space.
 */
export function joinSqlParts(parts: string[]): string {
  return parts.filter((p) => p.length > 0).join(" ");
}

/**
 * Validate and build a complete `BuiltQuery` from the given parts.
 * Centralises the final assembly so callers stay declarative.
 */
export function assembleQuery(parts: string[], params: unknown[]): BuiltQuery {
  return {
    sql: joinSqlParts(parts),
    params,
  };
}
