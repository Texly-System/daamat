import type { ModuleSchema } from "@damatjs/orm-type";
import type { CreateExtensionChange, SchemaChange } from "../types/diff";
import { PRIORITY } from "./priority";

function inferredExtensions(schema: ModuleSchema): Set<string> {
  const extensions = new Set(schema.extensions ?? []);
  for (const table of schema.tables) {
    for (const column of table.columns) {
      if (column.type === "vector" || column.type === "halfvec") {
        extensions.add("vector");
      }
    }
  }
  return extensions;
}

/** Return sorted, deduplicated extension requirements, including pgvector. */
export function requiredExtensions(schema: ModuleSchema): string[] {
  return [...inferredExtensions(schema)].filter(Boolean).sort();
}

/** Diff extensions additively; extension removal is intentionally ignored. */
export function diffExtensions(
  previous: ModuleSchema,
  current: ModuleSchema,
): SchemaChange[] {
  const oldExtensions = new Set(requiredExtensions(previous));
  return requiredExtensions(current)
    .filter((extension) => !oldExtensions.has(extension))
    .map(
      (extension): CreateExtensionChange => ({
        type: "create_extension",
        extension,
        priority: PRIORITY.CREATE_EXTENSION,
      }),
    );
}

/** Ensure a snapshot retains inferred extension requirements. */
export function withRequiredExtensions(schema: ModuleSchema): ModuleSchema {
  const extensions = requiredExtensions(schema);
  return extensions.length ? { ...schema, extensions } : { ...schema };
}
