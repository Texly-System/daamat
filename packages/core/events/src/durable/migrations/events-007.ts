import type { SystemMigration } from "@damatjs/durability";
import { relocateDamatRelations } from "@damatjs/durability";

export const events007: SystemMigration = {
  owner: "@damatjs/events",
  id: "007",
  order: 1220,
  sql: relocateDamatRelations([
    "_damat_event_outbox",
    "_damat_event_deliveries",
    "_damat_event_delivery_attempts",
    "_damat_event_activity",
    "_damat_event_logs",
  ]),
};
