import type { SystemMigration } from "@damatjs/durability";

export const events006: SystemMigration = {
  owner: "@damatjs/events",
  id: "006",
  order: 950,
  sql: `ALTER TABLE "_damat_event_outbox"
    ADD COLUMN IF NOT EXISTS "intent_fingerprint" TEXT`,
};
