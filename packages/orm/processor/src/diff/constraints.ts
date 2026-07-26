import type { ConstraintSchema } from "@damatjs/orm-type";
import type { SchemaChange } from "../types/diff";
import { PRIORITY } from "./priority";

const key = (constraint: ConstraintSchema, index: number) =>
  constraint.name ?? `${constraint.type}_${index}`;

export function diffConstraints(
  tableName: string,
  schema: string,
  oldConstraints: ConstraintSchema[],
  newConstraints: ConstraintSchema[],
): { changes: SchemaChange[]; warnings: string[] } {
  const changes: SchemaChange[] = [];
  const warnings: string[] = [];
  const oldMap = new Map(
    oldConstraints.map((item, index) => [key(item, index), item]),
  );
  const newMap = new Map(
    newConstraints.map((item, index) => [key(item, index), item]),
  );
  for (const [name, constraint] of newMap) {
    const old = oldMap.get(name);
    if (!old) {
      changes.push({
        type: "add_constraint",
        tableName,
        schema,
        constraint,
        priority: PRIORITY.ADD_CONSTRAINT,
      });
    } else if (JSON.stringify(old) !== JSON.stringify(constraint)) {
      changes.push({
        type: "drop_constraint",
        tableName,
        schema,
        constraint: old,
        priority: PRIORITY.DROP_CONSTRAINT,
      });
      changes.push({
        type: "add_constraint",
        tableName,
        schema,
        constraint,
        priority: PRIORITY.READD_CONSTRAINT,
      });
      warnings.push(
        `Replacing constraint '${name}' on '${schema}.${tableName}' may reject existing data`,
      );
    }
  }
  for (const [name, constraint] of oldMap) {
    if (!newMap.has(name)) {
      changes.push({
        type: "drop_constraint",
        tableName,
        schema,
        constraint,
        priority: PRIORITY.DROP_CONSTRAINT,
      });
      warnings.push(
        `Dropping constraint '${name}' on '${schema}.${tableName}' removes an integrity rule`,
      );
    }
  }
  return { changes, warnings };
}
