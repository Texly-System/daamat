import type { SystemMigration } from "./types";

export const shared005: SystemMigration = {
  owner: "@damatjs/durability",
  id: "005",
  order: 290,
  sql: `ALTER TABLE "_damat_idempotency_keys"
    ADD COLUMN IF NOT EXISTS "intent_fingerprint" TEXT`,
};
