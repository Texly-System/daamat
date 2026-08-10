import pgvector from "@damatjs/deps/pgvector";
import { assertVectorValue } from "@damatjs/orm-model";

export const operatorKeys = [
  "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
  "in", "notIn", "isNull", "isNotNull", "between",
];

export function isOperator(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => operatorKeys.includes(key));
}

export function valuesForWhere(value: unknown): unknown[] {
  if (!isOperator(value)) return value === null ? [] : [value];
  const values: unknown[] = [];
  for (const key of operatorKeys) {
    if (!(key in value) || key === "isNull" || key === "isNotNull") continue;
    const item = value[key];
    if ((key === "eq" || key === "neq") && item === null) continue;
    if (key === "in" || key === "notIn" || key === "between") {
      values.push(...(item as unknown[]));
    } else values.push(item);
  }
  return values;
}

export function toVectorSql(
  value: unknown,
  column: string,
  dimensions: number,
): string {
  assertVectorValue(value, dimensions, column);
  return pgvector.toSql(value) as string;
}

export function consumeWhereParams(
  clauses: Record<string, unknown>[],
  params: unknown[],
  dimensions: Map<string, number>,
  cursor: { value: number },
): void {
  for (const clause of clauses) {
    for (const [column, condition] of Object.entries(clause)) {
      for (const value of valuesForWhere(condition)) {
        const index = cursor.value++;
        if (dimensions.has(column) && value != null) {
          params[index] = toVectorSql(value, column, dimensions.get(column)!);
        }
      }
    }
  }
}
