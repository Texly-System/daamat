import type { SchemaDiff } from "../types/diff";
import { reverseChange } from "./reverseChange";

/** Produce the inverse of a forward diff for a caller-managed down migration. */
export function reverseDiff(diff: SchemaDiff): SchemaDiff {
  const changes = diff.changes
    .map(reverseChange)
    .filter((change): change is NonNullable<typeof change> => !!change)
    .reverse();
  return { hasChanges: changes.length > 0, changes, warnings: [] };
}
