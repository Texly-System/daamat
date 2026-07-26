import type { SystemMigration } from "@damatjs/durability";

export const pipelines002: SystemMigration = {
  owner: "@damatjs/pipelines",
  id: "002",
  order: 1100,
  sql: `ALTER TABLE "_damat_pipeline_runs"
    ADD COLUMN IF NOT EXISTS "intent_fingerprint" TEXT`,
};
