import { IndexBuilder } from "./base";

/**
 * Create a new index builder.
 *
 * Usage:
 * ```ts
 * indexBuilder("name_idx").columns([table.name]).unique()
 * indexBuilder("created_at_idx").columns(["created_at"]).type("btree")
 * ```
 */
export function indexBuilder(name: string): IndexBuilder {
  return new IndexBuilder(name);
}

export * from "./base";
