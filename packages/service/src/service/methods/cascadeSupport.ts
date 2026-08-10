import type { ModelDefinition } from "@damatjs/orm-model";
import type { RelationSchema } from "@damatjs/orm-type";

export function childFkColumn(
  relation: RelationSchema,
  parentModel: ModelDefinition,
): string {
  if (relation.linkedBy?.[0]) return relation.linkedBy[0];
  if (relation.mappedBy?.[0]) return `${relation.mappedBy[0]}_id`;
  return `${parentModel._name}_id`;
}

export function primaryKeyColumn(model: ModelDefinition): string {
  const columns = model.toTableSchema().columns ?? [];
  return columns.find((column) => column.primaryKey)?.name ?? "id";
}
