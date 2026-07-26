import type { SystemMigration } from "@damatjs/durability";

export const jobs004: SystemMigration = {
  owner: "@damatjs/jobs",
  id: "004",
  order: 490,
  sql: `ALTER TABLE "_damat_job_deduplication"
    ADD COLUMN IF NOT EXISTS "intent_fingerprint" TEXT`,
};
