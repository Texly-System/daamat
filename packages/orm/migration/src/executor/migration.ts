/**
 * Migration Execution Operations
 *
 * Unified function for running a single SQL migration using pg Pool.
 */

import fs from "node:fs";
import type { Pool } from "@damatjs/deps/pg";
import { log } from "../logger";
import { MigrationTracker } from "../tracker";
import type { MigrationInfo } from "../types";
import { migrationChecksum, nonTransactionalConstruct } from "./checksum";
import { CommittedMigrationUntrackedError } from "./errors";

/**
 * Statements Postgres forbids inside a transaction block. A migration body
 * containing one must run WITHOUT the wrapping BEGIN/COMMIT (each statement
 * then autocommits), otherwise pg raises an opaque "cannot run inside a
 * transaction block" error at runtime.
 */
/**
 * Execute a single .sql migration file.
 */
export async function executeMigration(
  pool: Pool,
  migration: MigrationInfo,
  moduleName: string,
  tracker: MigrationTracker,
): Promise<{ success: boolean; error?: Error }> {
  const startTime = Date.now();

  try {
    // Read the raw SQL from the migration file
    const sql = fs.readFileSync(migration.path, "utf-8");
    const checksum = migrationChecksum(sql);
    const offending = nonTransactionalConstruct(sql);

    const client = await pool.connect();
    try {
      if (offending) {
        // Can't be wrapped in BEGIN/COMMIT; pg autocommits each statement.
        log(
          "info",
          `Running ${migration.name} outside a transaction`,
          `(${offending})`,
        );
        await client.query(sql);
        try {
          await tracker.recordApplied(
            moduleName,
            migration.name,
            Date.now() - startTime,
            client,
            checksum,
          );
        } catch (cause) {
          throw new CommittedMigrationUntrackedError(
            moduleName,
            migration.name,
            { cause },
          );
        }
      } else {
        await client.query("BEGIN");
        await client.query(sql);
        await tracker.recordApplied(
          moduleName,
          migration.name,
          Date.now() - startTime,
          client,
          checksum,
        );
        await client.query("COMMIT");
      }
    } catch (err) {
      // Only the transactional path has an open tx to roll back.
      if (!offending) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // A failed ROLLBACK must not mask the original migration error;
          // the connection is released below and pg discards the aborted tx.
        }
      }
      throw err;
    } finally {
      client.release();
    }

    const executionTime = Date.now() - startTime;
    log("success", `Applied: ${migration.name}`, `(${executionTime}ms)`);

    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log("error", `  Failed to apply: ${migration.name}`, err.message);
    return { success: false, error: err };
  }
}
