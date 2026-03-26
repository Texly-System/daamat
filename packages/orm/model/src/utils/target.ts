import { ModelDefinition } from '@/schema';

/**
 * Derive a default logical name from a table name.
 * Strips a trailing "s" so `"users"` → `"user"`, `"orders"` → `"order"`.
 * Used as the fallback `mappedBy` value when none is provided.
 *
 * @internal
 */
export function removeLastS(tableName: string): string {
  return tableName.endsWith("s") && tableName.length > 1
    ? tableName.slice(0, -1)
    : tableName;
}


// ─── Module Target ─────────────────────────────────────────────────────────────

/**
 * A relation target can be passed directly or wrapped in a thunk.
 * Thunks break circular-module-initialization issues.
 *
 * ```ts
 * BelongsTo(UserSchema)           // direct
 * BelongsTo(() => UserSchema)     // lazy — for circular refs
 * ```
 */
export type ModelTarget = ModelDefinition | (() => ModelDefinition);

/** Resolve a target thunk (or plain model) to the concrete model. */
export function resolveModuleTarget(target: ModelTarget): ModelDefinition {
  return typeof target === "function" ? target() : target;
}