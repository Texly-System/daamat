import { ColumnSchema } from "@/types";

// ─── Column name extraction ───────────────────────────────────────────────────

/**
 * Extract every column name from a `ColumnSchema[]` as a union of string
 * literals.  This is the compile-time "known columns" type for a model.
 */
export type ColumnNames<T extends ColumnSchema[]> = T[number]["name"];

// ─── Parameterised query result ───────────────────────────────────────────────

/**
 * The final output produced by every query builder's `.build()` method.
 * A separate process consumes this and executes it against the database.
 *
 * @example
 * ```ts
 * const q: BuiltQuery = UserSchema.select(["id", "email"]).where({ email: "a@b.com" }).build();
 * // q.sql    → 'SELECT "id","email" FROM "store"."user" WHERE "email" = $1'
 * // q.params → ["a@b.com"]
 * ```
 */
export interface BuiltQuery {
  /** Parameterised SQL string — use $1, $2, … placeholders. */
  sql: string;
  /** Ordered parameter values corresponding to the $N placeholders. */
  params: unknown[];
}

// ─── WHERE clause types ───────────────────────────────────────────────────────

/**
 * Operators supported by the object-style `.where()` API.
 *
 * For a single equality check you can pass the raw value directly.
 * For any other comparison you wrap it in an operator object.
 *
 * @example
 * ```ts
 * .where({ age: { gt: 18, lte: 65 } })
 * .where({ status: "active" })
 * .where({ tags: { in: ["a", "b"] } })
 * ```
 */
export type WhereOperators =
  | { eq: unknown }
  | { neq: unknown }
  | { gt: unknown }
  | { gte: unknown }
  | { lt: unknown }
  | { lte: unknown }
  | { like: string }
  | { ilike: string }
  | { in: unknown[] }
  | { notIn: unknown[] }
  | { isNull: true }
  | { isNotNull: true }
  | { between: [unknown, unknown] };

/**
 * A single WHERE condition entry — either a shorthand equality value or an
 * operator object.
 */
export type WhereConditionValue = unknown | WhereOperators;

/**
 * Object-style WHERE clause keyed by column name.
 *
 * @example
 * ```ts
 * { email: "a@b.com" }
 * { age: { gte: 18 }, status: { in: ["active", "verified"] } }
 * ```
 */
export type WhereClause = Record<string, WhereConditionValue>;

/**
 * A raw SQL fragment with optional parameters.
 *
 * @example
 * ```ts
 * { sql: "created_at > now() - interval $1", params: ["30 days"] }
 * ```
 */
export interface RawWhereClause {
  sql: string;
  params?: unknown[];
}

// ─── ORDER BY ─────────────────────────────────────────────────────────────────

export type OrderDirection = "ASC" | "DESC";

export interface OrderByClause {
  column: string;
  direction?: OrderDirection;
  nulls?: "NULLS FIRST" | "NULLS LAST";
}

// ─── INSERT value map ─────────────────────────────────────────────────────────

/**
 * Map of column name → value for INSERT / UPDATE.
 * Uses `string` keys so any column name (validated at runtime/compile-time by
 * the builders) can be passed.
 */
export type ColumnValueMap = Record<string, unknown>;

// ─── Internal state shared across builders ────────────────────────────────────

/**
 * Resolved table identifier — already quoted and schema-qualified when needed.
 */
export interface TableRef {
  /** Schema name (e.g. `"store"`) or undefined when in the default schema. */
  schema?: string;
  /** Table name (e.g. `"user"`). */
  name: string;
}
