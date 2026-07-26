import type { QueryResultRow } from "@damatjs/deps/pg";
import {
  IdempotencyConflictError,
  type DurabilityExecutor,
} from "@damatjs/durability";

interface DeduplicationRow extends QueryResultRow {
  run_id: string;
  intent_fingerprint: string | null;
}

export async function claimJobDeduplication(
  executor: DurabilityExecutor,
  input: {
    queue: string;
    name: string;
    key: string;
    runId: string;
    expiresAt?: Date;
    fingerprint: string;
  },
): Promise<{ acquired: boolean; runId: string }> {
  const result = await executor.query<DeduplicationRow>(
    `INSERT INTO "_damat_job_deduplication"
       ("queue","job_name","deduplication_key","run_id","expires_at","intent_fingerprint")
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT ("queue","job_name","deduplication_key") DO UPDATE
       SET "run_id" = EXCLUDED."run_id",
          "expires_at" = EXCLUDED."expires_at", "created_at" = NOW(),
          "intent_fingerprint" = EXCLUDED."intent_fingerprint"
       WHERE "_damat_job_deduplication"."expires_at" IS NOT NULL
         AND "_damat_job_deduplication"."expires_at" <= NOW()
         AND "_damat_job_deduplication"."intent_fingerprint" IS NOT NULL
      RETURNING "run_id", "intent_fingerprint"`,
    [
      input.queue,
      input.name,
      input.key,
      input.runId,
      input.expiresAt ?? null,
      input.fingerprint,
    ],
  );
  const returned = result.rows[0];
  if (returned)
    return {
      acquired: returned.run_id === input.runId,
      runId: returned.run_id,
    };
  const existing = await executor.query<DeduplicationRow>(
    `SELECT "run_id", "intent_fingerprint" FROM "_damat_job_deduplication"
     WHERE "queue" = $1 AND "job_name" = $2 AND "deduplication_key" = $3`,
    [input.queue, input.name, input.key],
  );
  const row = existing.rows[0]!;
  if (row.intent_fingerprint !== input.fingerprint) {
    throw new IdempotencyConflictError(
      `job:${input.queue}:${input.name}`,
      input.key,
    );
  }
  return { acquired: false, runId: row.run_id };
}
