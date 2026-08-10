import type { z } from "@damatjs/deps/zod";
import type { ModelDefinition } from "@damatjs/orm-model";
import type {
  PgEntityManager,
  PgRepository,
  TransactionalEntityManager,
} from "@damatjs/orm-pg";
import type { QueryResultRow, RelationSchema } from "@damatjs/orm-type";

export interface ModelMethodsState {
  model: ModelDefinition;
  modelName: string;
  transactionalEm: TransactionalEntityManager | null;
  entityManager?: PgEntityManager<Record<string, ModelDefinition>>;
  _relations: RelationSchema[] | null;
  _validationSchema: z.ZodObject<z.ZodRawShape> | null;
}

export function stateOf(methods: unknown): ModelMethodsState {
  return methods as ModelMethodsState;
}

export function getRepository<T extends QueryResultRow>(
  methods: unknown,
): PgRepository<T> {
  const state = stateOf(methods);
  if (!state.entityManager) throw new Error("EntityManager not initialized");
  if (state.transactionalEm) {
    return state.transactionalEm.getRepository<T>(state.modelName);
  }
  return state.entityManager.getRepository<T>(state.modelName);
}

export function getRelatedRepository<T extends QueryResultRow>(
  methods: unknown,
  name: string,
): PgRepository<T> {
  const state = stateOf(methods);
  if (!state.entityManager) throw new Error("EntityManager not initialized");
  if (state.transactionalEm) return state.transactionalEm.getRepository<T>(name);
  return state.entityManager.getRepository<T>(name);
}

export function getRelations(methods: unknown): RelationSchema[] {
  const state = stateOf(methods);
  if (!state._relations) state._relations = state.model.toTableSchema().relations ?? [];
  return state._relations ?? [];
}
