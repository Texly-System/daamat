import type { ConstraintSchema } from "@damatjs/orm-type";
import type {
  AddConstraintChange,
  DropConstraintChange,
  MigrationGeneratorOptions,
} from "../types";
import { qualifiedTable, quoteIdentifier, resolveSchema } from "./utils";

function validate(constraint: ConstraintSchema): void {
  if (!constraint.name) throw new Error("Table constraints require a name");
  if (constraint.type === "primary_key" && constraint.where) {
    throw new Error(
      `Primary key constraint '${constraint.name}' cannot be partial`,
    );
  }
  if (constraint.type === "check" && constraint.deferrable) {
    throw new Error(
      `Check constraint '${constraint.name}' cannot be deferrable`,
    );
  }
  if (constraint.type === "check" && constraint.where) {
    throw new Error(`Check constraint '${constraint.name}' cannot use WHERE`);
  }
  if (
    (constraint.type === "unique" || constraint.type === "primary_key") &&
    constraint.columns.length === 0
  ) {
    throw new Error(`Constraint '${constraint.name}' requires columns`);
  }
  if (constraint.type === "exclude" && constraint.expressions.length === 0) {
    throw new Error(
      `Exclusion constraint '${constraint.name}' requires expressions`,
    );
  }
}

function deferred(constraint: ConstraintSchema): string {
  if (!constraint.deferrable) return "";
  return ` DEFERRABLE${constraint.initiallyDeferred ? " INITIALLY DEFERRED" : ""}`;
}

export function generateAddConstraint(
  change: AddConstraintChange,
  options: MigrationGeneratorOptions,
): string {
  const item = change.constraint;
  validate(item);
  const schema = resolveSchema(options, change.schema);
  const table = qualifiedTable(change.tableName, schema);
  const name = quoteIdentifier(item.name!);
  if (item.type === "unique" && item.where) {
    const columns = item.columns.map(quoteIdentifier).join(", ");
    return `CREATE UNIQUE INDEX ${name} ON ${table} (${columns}) WHERE ${item.where}`;
  }
  let clause: string;
  if (item.type === "unique" || item.type === "primary_key") {
    const columns = item.columns.map(quoteIdentifier).join(", ");
    clause = `${item.type === "unique" ? "UNIQUE" : "PRIMARY KEY"} (${columns})${deferred(item)}`;
  } else if (item.type === "check") {
    clause = `CHECK (${item.condition})`;
  } else {
    const expressions = item.expressions
      .map(
        (part) =>
          `${part.expression ?? quoteIdentifier(part.column)} WITH ${part.operator}`,
      )
      .join(", ");
    clause = `EXCLUDE USING ${(item.indexType ?? "gist").toUpperCase()} (${expressions})${item.where ? ` WHERE (${item.where})` : ""}${deferred(item)}`;
  }
  return `ALTER TABLE ${table} ADD CONSTRAINT ${name} ${clause}`;
}

export function generateDropConstraint(
  change: DropConstraintChange,
  options: MigrationGeneratorOptions,
): string {
  validate(change.constraint);
  const schema = resolveSchema(options, change.schema);
  const name = quoteIdentifier(change.constraint.name!);
  if (change.constraint.type === "unique" && change.constraint.where) {
    const exists = options.safeMode !== false ? " IF EXISTS" : "";
    return `DROP INDEX${exists} ${qualifiedTable(change.constraint.name!, schema)}`;
  }
  const exists = options.safeMode !== false ? " IF EXISTS" : "";
  return `ALTER TABLE ${qualifiedTable(change.tableName, schema)} DROP CONSTRAINT${exists} ${name}`;
}
