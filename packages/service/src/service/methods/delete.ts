import type { QueryResultRow } from "@damatjs/orm-type";
import type { DeleteOptions, SoftDeleteOptions } from "../type";
import { cascade, withCascadeTransaction } from "./cascade";
import { getRelatedRepository, getRepository, stateOf } from "./state";

export async function deleteRows(
  methods: unknown,
  options: DeleteOptions,
): Promise<number> {
  if (!options.cascade) {
    return getRepository(methods).delete({
      where: options.where,
      returning: options.returning,
    } as any);
  }
  const state = stateOf(methods);
  return withCascadeTransaction(methods, async () => {
    const targets = (await getRelatedRepository(methods, state.modelName).findMany({
      where: options.where,
    } as any)) as Record<string, any>[];
    const result = await cascade(
      methods,
      state.model,
      state.modelName,
      targets,
      "hard",
      new Set(),
    );
    return result.count;
  });
}

export async function softDeleteRows(
  methods: unknown,
  options: SoftDeleteOptions,
): Promise<QueryResultRow[]> {
  const state = stateOf(methods);
  const deletedAtField = state.model._deletedAtField ?? "deleted_at";
  if (!options.cascade) {
    return getRepository(methods).update({
      set: { [deletedAtField]: new Date() },
      where: options.where,
      returning: options.returning,
    } as any);
  }
  return withCascadeTransaction(methods, async () => {
    const targets = (await getRelatedRepository(methods, state.modelName).findMany({
      where: options.where,
    } as any)) as Record<string, any>[];
    const result = await cascade(
      methods,
      state.model,
      state.modelName,
      targets,
      "soft",
      new Set(),
    );
    return result.rows as QueryResultRow[];
  });
}

export async function restoreRows(
  methods: unknown,
  options: { where: Record<string, unknown>; returning?: string[] },
): Promise<QueryResultRow[]> {
  const state = stateOf(methods);
  const deletedAtField = state.model._deletedAtField ?? "deleted_at";
  return getRepository(methods).update({
    set: { [deletedAtField]: null },
    where: options.where,
    returning: options.returning,
  } as any);
}
