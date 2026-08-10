import type { ModelDefinition } from "@damatjs/orm-model";
import type { RelationDescriptor } from "@damatjs/orm-type";
import { resolveModelRelations } from "../query/relations";
import { consumeWhereParams } from "./vectorValues";

function skipRawParams(relations: RelationDescriptor[], cursor: { value: number }): void {
  for (const relation of relations) {
    for (const raw of relation.whereRaw) cursor.value += raw.params?.length ?? 0;
  }
}

export function consumeRelationParams(
  model: ModelDefinition,
  relations: RelationDescriptor[] | undefined,
  params: unknown[],
  cursor: { value: number },
): void {
  if (!relations) return;
  const resolved = resolveModelRelations(model);
  for (const relation of relations) {
    const target = resolved.get(relation.relation)?.target;
    if (!target) continue;
    const dimensions = new Map(
      target.toTableSchema().columns
        .filter((column) => column.type === "vector" || column.type === "halfvec")
        .map((column) => [column.name, column.dimensions ?? 0]),
    );
    consumeWhereParams(relation.where, params, dimensions, cursor);
    skipRawParams([relation], cursor);
  }
}
