import type { ModuleSnapshot } from "../../types/snapshot";

/**
 * The result of comparing two snapshots.
 * Produced by the diff layer (not yet implemented).
 */
export type SnapshotDiff = {
  /** Tables added in the current snapshot */
  addedTables: string[];
  /** Tables removed from the previous snapshot */
  droppedTables: string[];
  /** Tables present in both snapshots but with column / index / FK changes */
  modifiedTables: string[];
  /** Native enum types added */
  addedEnums: string[];
  /** Native enum types removed */
  droppedEnums: string[];
  /** Native enum types whose values changed */
  modifiedEnums: string[];
};

/**
 * Compute the structural difference between two snapshots.
 *
 * @stub  Implementation lives in the diff layer (not yet wired).
 */
export function diffSnapshots(
  _previous: ModuleSnapshot,
  _current: ModuleSnapshot,
): SnapshotDiff {
  throw new Error("diffSnapshots: not yet implemented — wire the diff layer");
}
