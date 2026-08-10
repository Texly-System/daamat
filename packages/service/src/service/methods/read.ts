import type { QueryResultRow } from "@damatjs/orm-type";
import { getRepository } from "./state";
import { applySoftDeleteFilter, buildFindOptions } from "./readOptions";
import { loadRelations } from "./readRelations";
import type { FindOptions } from "../type";

export async function find<T extends QueryResultRow>(
  methods: unknown,
  options: FindOptions = {},
): Promise<(T & Record<string, any>) | null> {
  const repo = getRepository<T>(methods);
  const result = await repo.findOne(buildFindOptions(methods, options, false) as any);
  if (!result) return null;
  if (!options.include || options.include.length === 0) {
    return result as T & Record<string, any>;
  }
  return loadRelations(methods, result, options.include);
}

export async function findMany<T extends QueryResultRow>(
  methods: unknown,
  options: FindOptions = {},
): Promise<(T & Record<string, any>)[]> {
  const repo = getRepository<T>(methods);
  const records = await repo.findMany(buildFindOptions(methods, options, true) as any);
  if (!options.include || options.include.length === 0 || records.length === 0) {
    return records as (T & Record<string, any>)[];
  }
  const results: (T & Record<string, any>)[] = [];
  for (const record of records) {
    results.push(await loadRelations(methods, record, options.include));
  }
  return results;
}

export function findById<T extends QueryResultRow>(
  methods: unknown,
  id: unknown,
  options: Omit<FindOptions, "where"> = {},
): Promise<(T & Record<string, any>) | null> {
  return find<T>(methods, { ...options, where: { id } });
}

export function findOne<T extends QueryResultRow>(
  methods: unknown,
  where: Record<string, unknown>,
  options: Omit<FindOptions, "where"> = {},
): Promise<(T & Record<string, any>) | null> {
  return find<T>(methods, { ...options, where });
}

export async function count(
  methods: unknown,
  where: Record<string, unknown> | undefined,
  withDeleted: boolean | undefined,
): Promise<number> {
  const repo = getRepository(methods);
  return repo.count(applySoftDeleteFilter(methods, where, withDeleted));
}

export async function exists(
  methods: unknown,
  where: Record<string, unknown>,
  withDeleted: boolean | undefined,
): Promise<boolean> {
  const repo = getRepository(methods);
  return repo.exists(applySoftDeleteFilter(methods, where, withDeleted) ?? {});
}
