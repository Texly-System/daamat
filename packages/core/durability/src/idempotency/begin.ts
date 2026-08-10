import {
  IdempotencyConflictError,
  IdempotencyInProgressError,
} from "../errors";
import { canonicalJson, intentFingerprint } from "../intent";
import type { DurabilityExecutor } from "../client/types";
import type {
  IdempotencyClaim,
  IdempotencyOptions,
  IdempotencyRow,
  JsonValue,
} from "./types";
import { damatRelation } from "../migrations/relocation";

export async function beginIdempotency(
  executor: DurabilityExecutor,
  options: IdempotencyOptions,
): Promise<IdempotencyClaim> {
  const metadata = canonicalJson(options.metadata ?? {});
  const fingerprint = intentFingerprint(options.metadata ?? {});
  const inserted = await executor.query(
    `INSERT INTO ${damatRelation("_damat_idempotency_keys")}
       ("scope", "key", "status", "operation", "expires_at", "intent_fingerprint")
     VALUES ($1, $2, 'running', $3::jsonb, $4, $5)
     ON CONFLICT ("scope", "key") DO NOTHING
     RETURNING "scope"`,
    [
      options.scope,
      options.key,
      metadata,
      options.expiresAt ?? null,
      fingerprint,
    ],
  );
  if (inserted.rowCount === 1) return { acquired: true };

  const selected = await executor.query<IdempotencyRow>(
    `SELECT "status", "result", "intent_fingerprint",
       ("expires_at" IS NOT NULL AND "expires_at" <= NOW()) AS "expired"
     FROM ${damatRelation("_damat_idempotency_keys")}
     WHERE "scope" = $1 AND "key" = $2
     FOR UPDATE`,
    [options.scope, options.key],
  );
  const row = selected.rows[0];
  if (!row) return beginIdempotency(executor, options);
  if (row.intent_fingerprint === null) {
    throw new IdempotencyConflictError(options.scope, options.key);
  }
  if (row.expired) {
    await resetExpired(executor, options, metadata, fingerprint);
    return { acquired: true };
  }
  if (row.intent_fingerprint !== fingerprint) {
    throw new IdempotencyConflictError(options.scope, options.key);
  }
  if (row.status === "completed") {
    return { acquired: false, value: row.result as JsonValue };
  }
  throw new IdempotencyInProgressError(options.scope, options.key);
}

async function resetExpired(
  executor: DurabilityExecutor,
  options: IdempotencyOptions,
  metadata: string,
  fingerprint: string,
): Promise<void> {
  await executor.query(
    `UPDATE ${damatRelation("_damat_idempotency_keys")}
     SET "status" = 'running', "result" = NULL, "operation" = $3::jsonb,
        "created_at" = NOW(), "completed_at" = NULL, "expires_at" = $4,
        "intent_fingerprint" = $5
     WHERE "scope" = $1 AND "key" = $2`,
    [
      options.scope,
      options.key,
      metadata,
      options.expiresAt ?? null,
      fingerprint,
    ],
  );
}
