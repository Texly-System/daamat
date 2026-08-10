import type { ModelDefinition } from "@damatjs/orm-model";
import type { QueryResultRow, RelationSchema } from "@damatjs/orm-type";
import { getRelatedRepository, getRelations, stateOf } from "./state";

export async function loadRelations<T extends QueryResultRow>(
  methods: unknown,
  record: T,
  include: string[],
): Promise<T & Record<string, any>> {
  const loaded: Record<string, any> = { ...record };
  for (const relationName of include) {
    const relation = getRelations(methods).find((entry) => entry.from === relationName);
    if (relation) loaded[relationName] = await loadRelation(methods, record, relation);
  }
  return loaded as T & Record<string, any>;
}

async function loadRelation<T extends QueryResultRow>(
  methods: unknown,
  record: T,
  relation: RelationSchema,
): Promise<any> {
  const relatedRepo = getRelatedRepository(methods, relation.to);
  const pkValue = (record as any).id;
  if (relation.type === "belongsTo") {
    const fkColumn = relation.linkedBy?.[0];
    if (!fkColumn) return null;
    const fkValue = (record as any)[fkColumn];
    if (!fkValue) return null;
    return relatedRepo.findOne({ where: { id: fkValue } as any });
  }
  const fkColumn = relation.mappedBy?.[0]
    ? `${relation.mappedBy[0]}_id`
    : `${stateOf(methods).model._name}_id`;
  if (relation.type === "hasMany") {
    return relatedRepo.findMany({ where: { [fkColumn]: pkValue } as any });
  }
  if (relation.type === "hasOne") {
    return relatedRepo.findOne({ where: { [fkColumn]: pkValue } as any });
  }
  return null;
}

export function updatedAtColumn(methods: unknown): string | null {
  const columns = stateOf(methods).model.toTableSchema().columns ?? [];
  const found = columns.find(
    (column) => column.name === "updated_at" || column.name === "updatedAt",
  );
  return found ? found.name : null;
}

export function withUpdatedAt(
  methods: unknown,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const column = updatedAtColumn(methods);
  if (!column || Object.prototype.hasOwnProperty.call(data, column)) return data;
  return { ...data, [column]: new Date() };
}

export function resolveModel(methods: unknown, name: string): ModelDefinition {
  const state = stateOf(methods);
  if (name === state.modelName) return state.model;
  const registry = state.entityManager?.getModelRegistry() as
    | {
        get(n: string): { model?: ModelDefinition } | undefined;
        getByTableName(n: string): { model?: ModelDefinition } | undefined;
      }
    | undefined;
  const model = registry?.get(name)?.model ?? registry?.getByTableName(name)?.model;
  if (!model) {
    throw new Error(
      `Cannot cascade into "${name}": model is not registered with the entity manager.`,
    );
  }
  return model;
}
