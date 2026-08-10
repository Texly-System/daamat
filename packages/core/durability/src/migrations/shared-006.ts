import { relocateDamatRelations } from "./relocation";
import type { SystemMigration } from "./types";

export const shared006: SystemMigration = {
  owner: "@damatjs/durability",
  id: "006",
  order: 1200,
  sql: relocateDamatRelations([
    "_damat_idempotency_keys",
    "_damat_workers",
    "_damat_work_controls",
    "_damat_work_control_activity",
    "_damat_maintenance_activity",
    "_damat_acceleration_outbox",
    "_damat_acceleration_state",
    "_damat_retention_overrides",
  ]),
};
