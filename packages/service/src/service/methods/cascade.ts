import type { ModelDefinition } from "@damatjs/orm-model";
import { getRelatedRepository, stateOf } from "./state";
import { cascadeRelation } from "./cascadeRelation";
import { primaryKeyColumn } from "./cascadeSupport";

export async function withCascadeTransaction<R>(
  methods: unknown,
  fn: () => Promise<R>,
): Promise<R> {
  const state = stateOf(methods);
  if (state.transactionalEm) return fn();
  if (!state.entityManager) throw new Error("EntityManager not initialized");
  return state.entityManager.transaction(async (tx) => {
    state.transactionalEm = tx;
    try {
      return await fn();
    } finally {
      state.transactionalEm = null;
    }
  });
}

export async function cascade(
  methods: unknown,
  model: ModelDefinition,
  modelName: string,
  targetRows: Record<string, any>[],
  mode: "hard" | "soft",
  visited: Set<string>,
): Promise<{ count: number; rows: Record<string, any>[] }> {
  if (targetRows.length === 0 || visited.has(modelName)) return { count: 0, rows: [] };
  visited.add(modelName);
  const pk = primaryKeyColumn(model);
  const targetIds = targetRows
    .map((row) => row[pk])
    .filter((value) => value !== undefined && value !== null);
  if (targetIds.length === 0) {
    visited.delete(modelName);
    return { count: 0, rows: [] };
  }
  let childCount = 0;
  const relations = (model.toTableSchema().relations ?? []).filter(
    (relation) => relation.type === "hasMany" || relation.type === "hasOne",
  );
  for (const relation of relations) {
    childCount += await cascadeRelation(
      methods,
      model,
      modelName,
      relation,
      targetIds,
      mode,
      visited,
      (childModel, childName, childRows, childMode, childVisited) =>
        cascade(methods, childModel, childName, childRows, childMode, childVisited),
    );
  }
  visited.delete(modelName);
  const repo = getRelatedRepository(methods, modelName);
  if (mode === "hard") {
    const removed = await repo.delete({
      where: { [pk]: { in: targetIds } },
    } as any);
    return { count: childCount + removed, rows: targetRows };
  }
  const deletedAtField = model._deletedAtField ?? "deleted_at";
  const rows = (await repo.update({
    set: { [deletedAtField]: new Date() },
    where: { [pk]: { in: targetIds } },
  } as any)) as Record<string, any>[];
  return { count: childCount + (rows?.length ?? targetIds.length), rows };
}
