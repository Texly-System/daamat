import type { IndexSchema } from "@damatjs/orm-type";
import { quoteIdentifier } from "./utils";

export function resolvedIndexName(
  tableName: string,
  index: IndexSchema,
): string {
  if (index.name) return index.name;
  if (index.columns.some((column) => typeof column !== "string" && "expression" in column)) {
    throw new Error("Expression indexes require an explicit name");
  }
  const columns = index.columns
    .map((column) => (typeof column === "string" ? column : column.name))
    .join("_");
  return `${tableName}_${columns}_idx`;
}

export function renderIndexColumn(column: string | { name?: string; expression?: string; operatorClass?: string; order?: string }): string {
  if (typeof column === "string") return quoteIdentifier(column);
  const expression = column.expression
    ? column.expression
    : quoteIdentifier(column.name ?? "");
  const operatorClass = column.operatorClass
    ? ` ${column.operatorClass}`
    : "";
  const order = column.order ? ` ${column.order}` : "";
  return `${expression}${operatorClass}${order}`;
}

function renderStorageValue(value: string | number | boolean): string {
  if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
  return String(value);
}

export function renderStorageParams(
  parameters?: Record<string, string | number | boolean>,
): string {
  if (!parameters || Object.keys(parameters).length === 0) return "";
  const entries = Object.keys(parameters)
    .sort()
    .map((key) => `${key} = ${renderStorageValue(parameters[key]!)}`);
  return ` WITH (${entries.join(", ")})`;
}
