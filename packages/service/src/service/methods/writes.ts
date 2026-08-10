import type { QueryResultRow } from "@damatjs/orm-type";
import type {
  CreateManyOptions,
  CreateOptions,
  UpdateOptions,
  UpsertManyOptions,
  UpsertOptions,
} from "../type";
import { getRepository } from "./state";
import { validateData } from "./validation";
import { withUpdatedAt } from "./readRelations";

export async function create<T extends QueryResultRow>(
  methods: unknown,
  options: CreateOptions,
): Promise<T> {
  validateData(methods, options.data);
  return getRepository<T>(methods).create(options as any);
}

export async function createMany<T extends QueryResultRow>(
  methods: unknown,
  options: CreateManyOptions,
): Promise<T[]> {
  for (const item of options.data) validateData(methods, item);
  return getRepository<T>(methods).createMany(options as any);
}

export async function upsert<T extends QueryResultRow>(
  methods: unknown,
  options: UpsertOptions,
): Promise<T> {
  validateData(methods, options.data);
  return getRepository<T>(methods).upsert(options as any);
}

export async function upsertMany<T extends QueryResultRow>(
  methods: unknown,
  options: UpsertManyOptions,
): Promise<T[]> {
  for (const item of options.data) validateData(methods, item);
  return getRepository<T>(methods).upsertMany(options as any);
}

export async function update<T extends QueryResultRow>(
  methods: unknown,
  options: UpdateOptions,
): Promise<T[]> {
  validateData(methods, options.data, true);
  return getRepository<T>(methods).update({
    set: withUpdatedAt(methods, options.data),
    where: options.where,
    returning: options.returning,
  } as any);
}

export async function updateOne<T extends QueryResultRow>(
  methods: unknown,
  options: UpdateOptions,
): Promise<T | null> {
  validateData(methods, options.data, true);
  const row = await getRepository<T>(methods).updateOne(
    withUpdatedAt(methods, options.data as Record<string, unknown>),
    options.where,
    options.returning,
  );
  return row ?? null;
}
