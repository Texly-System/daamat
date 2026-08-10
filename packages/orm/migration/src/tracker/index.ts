import type { DurabilityExecutor } from "@damatjs/durability";
import { migrationId } from "./id";
import {
  MIGRATION_TRACKER_RELATION,
  MIGRATION_TRACKER_SCHEMA,
} from "./schema";
import type { AppliedMigration } from "./types";

export type { AppliedMigration } from "./types";

/** Migration tracking table operations. */
export class MigrationTracker {
  constructor(private executor: DurabilityExecutor) {}

  /** Ensure the migration tracking table exists. */
  async ensureTable(): Promise<void> {
    await this.executor.query(MIGRATION_TRACKER_SCHEMA);
  }

  /** Get applied migrations for a module, or for all modules. */
  async getApplied(moduleName?: string): Promise<AppliedMigration[]> {
    if (moduleName) {
      const res = await this.executor.query<AppliedMigration>(
        `SELECT module, name, applied_at, checksum, adopted_at,
                        adoption_actor, adoption_reason
                 FROM ${MIGRATION_TRACKER_RELATION}
                 WHERE status = 'applied' AND module = $1
                 ORDER BY applied_at ASC`,
        [moduleName],
      );
      return res.rows;
    }

    const res = await this.executor.query<AppliedMigration>(
      `SELECT module, name, applied_at, checksum, adopted_at,
                      adoption_actor, adoption_reason
             FROM ${MIGRATION_TRACKER_RELATION}
             WHERE status = 'applied'
             ORDER BY applied_at ASC`,
    );
    return res.rows;
  }

  async recordApplied(
    module: string,
    name: string,
    executionTimeMs: number,
    executor: DurabilityExecutor = this.executor,
    checksum?: string,
  ): Promise<void> {
    await executor.query(
      `INSERT INTO ${MIGRATION_TRACKER_RELATION}
               (id, module, name, execution_time_ms, status, checksum)
             VALUES ($1, $2, $3, $4, 'applied', $5)
             ON CONFLICT (module, name) DO UPDATE SET
                 applied_at         = NOW(),
                 reverted_at        = NULL,
                 execution_time_ms  = $4,
                 status             = 'applied',
                 checksum           = $5`,
      [migrationId(module, name), module, name, executionTimeMs, checksum],
    );
  }

  async recordAdopted(
    module: string,
    name: string,
    checksum: string,
    actor: string,
    reason: string,
    executor: DurabilityExecutor = this.executor,
  ): Promise<boolean> {
    const result = await executor.query(
      `INSERT INTO ${MIGRATION_TRACKER_RELATION}
         (id, module, name, status, checksum, adopted_at,
          adoption_actor, adoption_reason)
       VALUES ($1, $2, $3, 'applied', $4, NOW(), $5, $6)
       ON CONFLICT (module, name) DO NOTHING`,
      [migrationId(module, name), module, name, checksum, actor, reason],
    );
    return (result.rowCount ?? 0) === 1;
  }

  async recordReverted(module: string, name: string): Promise<void> {
    // Key off (module, name) so pre-existing rows written with the old
    // `${module}_${name}` id scheme still match regardless of id format.
    await this.executor.query(
      `UPDATE ${MIGRATION_TRACKER_RELATION}
             SET reverted_at = NOW(), status = 'reverted'
             WHERE module = $1 AND name = $2`,
      [module, name],
    );
  }
}
