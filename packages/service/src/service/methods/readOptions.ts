import type { ModelDefinition } from "@damatjs/orm-model";
import { MAX_PAGE_SIZE, type FindOptions } from "../type";
import { stateOf } from "./state";

export function buildFindOptions(
  methods: unknown,
  options: FindOptions,
  paginate: boolean,
): Record<string, unknown> {
  const repoOpts: Record<string, unknown> = {};
  if (options.select) repoOpts.select = options.select;
  const where = applySoftDeleteFilter(
    methods,
    options.where,
    options.withDeleted,
  );
  if (where !== undefined) repoOpts.where = where;
  if (options.orderBy) {
    repoOpts.orderBy = options.orderBy.map((entry) =>
      sanitizeOrderBy(methods, entry),
    );
  }
  if (paginate) {
    const limit = resolveLimit(methods, options.take);
    if (limit !== undefined) repoOpts.limit = limit;
    const offset = resolvePositiveInt(methods, options.skip, "skip");
    if (offset !== undefined) repoOpts.offset = offset;
  }
  return repoOpts;
}

function sanitizeOrderBy(
  methods: unknown,
  entry: { column: string; direction?: string; nulls?: string },
): { column: string; direction?: "ASC" | "DESC"; nulls?: string } {
  const out: { column: string; direction?: "ASC" | "DESC"; nulls?: string } = {
    column: entry.column,
  };
  const modelName = stateOf(methods).modelName;
  if (entry.direction !== undefined) {
    const direction = String(entry.direction).toUpperCase();
    if (direction !== "ASC" && direction !== "DESC") {
      throw new Error(`[service:${modelName}] orderBy.direction must be ASC or DESC`);
    }
    out.direction = direction as "ASC" | "DESC";
  }
  if (entry.nulls !== undefined) {
    const nulls = String(entry.nulls).toUpperCase();
    if (nulls !== "NULLS FIRST" && nulls !== "NULLS LAST") {
      throw new Error(`[service:${modelName}] orderBy.nulls must be NULLS FIRST or NULLS LAST`);
    }
    out.nulls = nulls;
  }
  return out;
}

function resolveLimit(methods: unknown, take: unknown): number | undefined {
  const value = resolvePositiveInt(methods, take, "take");
  return value === undefined ? undefined : Math.min(value, MAX_PAGE_SIZE);
}

function resolvePositiveInt(
  methods: unknown,
  value: unknown,
  context: string,
): number | undefined {
  if (value === undefined || value === null) return undefined;
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new Error(
      `[service:${stateOf(methods).modelName}] ${context} must be a non-negative integer`,
    );
  }
  return numberValue;
}

function softDeleteField(model: ModelDefinition): string | null {
  if (!model._softDelete) return null;
  const field = model._deletedAtField ?? "deleted_at";
  const columns = model.toTableSchema().columns ?? [];
  return columns.some((column) => column.name === field) ? field : null;
}

export function applySoftDeleteFilter(
  methods: unknown,
  where: Record<string, unknown> | undefined,
  withDeleted: boolean | undefined,
): Record<string, unknown> | undefined {
  const state = stateOf(methods);
  const field = softDeleteField(state.model);
  if (!field || withDeleted) return where;
  if (where && Object.prototype.hasOwnProperty.call(where, field)) return where;
  return { ...where, [field]: { isNull: true } };
}
