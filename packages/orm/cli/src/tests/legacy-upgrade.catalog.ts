import {
  collectSystemMigrations,
  durabilitySystemMigrations,
} from "@damatjs/durability";
import { eventsSystemMigrations } from "@damatjs/events/migrations";
import { jobsSystemMigrations } from "@damatjs/jobs/migrations";
import { pipelinesSystemMigrations } from "@damatjs/pipelines/migrations";

export const PRODUCTION_RELATIONS = [
  "_damat_idempotency_keys",
  "_damat_workers",
  "_damat_work_controls",
  "_damat_work_control_activity",
  "_damat_maintenance_activity",
  "_damat_acceleration_outbox",
  "_damat_acceleration_state",
  "_damat_retention_overrides",
  "_damat_job_runs",
  "_damat_job_attempts",
  "_damat_job_activity",
  "_damat_job_logs",
  "_damat_job_schedules",
  "_damat_job_schedule_activity",
  "_damat_job_deduplication",
  "_damat_event_outbox",
  "_damat_event_deliveries",
  "_damat_event_delivery_attempts",
  "_damat_event_activity",
  "_damat_event_logs",
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
] as const;

export const ALL_RELATIONS = [
  "_damat_migration_logs",
  ...PRODUCTION_RELATIONS,
];

export const SYSTEM_MIGRATIONS = collectSystemMigrations([
  durabilitySystemMigrations,
  jobsSystemMigrations,
  eventsSystemMigrations,
  pipelinesSystemMigrations,
]);

export const LEGACY_MIGRATIONS = SYSTEM_MIGRATIONS.filter(
  (migration) =>
    !(
      (migration.owner === "@damatjs/durability" && migration.id === "006") ||
      (migration.owner === "@damatjs/jobs" && migration.id === "005") ||
      (migration.owner === "@damatjs/events" && migration.id === "007") ||
      (migration.owner === "@damatjs/pipelines" && migration.id === "003")
    ),
);
