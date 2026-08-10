import type { SystemMigration } from "@damatjs/durability";
import { relocateDamatRelations } from "@damatjs/durability";

export const pipelines003: SystemMigration = {
  owner: "@damatjs/pipelines",
  id: "003",
  order: 1230,
  sql: relocateDamatRelations([
    "_damat_pipeline_definitions",
    "_damat_pipeline_versions",
    "_damat_pipeline_drafts",
    "_damat_pipeline_layouts",
    "_damat_pipeline_runs",
    "_damat_pipeline_node_executions",
    "_damat_pipeline_transitions",
    "_damat_pipeline_signals",
    "_damat_pipeline_trigger_receipts",
    "_damat_pipeline_schedules",
    "_damat_pipeline_trigger_controls",
    "_damat_pipeline_activity",
  ]),
};
