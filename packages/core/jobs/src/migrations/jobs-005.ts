import type { SystemMigration } from "@damatjs/durability";
import { relocateDamatRelations } from "@damatjs/durability";

export const jobs005: SystemMigration = {
  owner: "@damatjs/jobs",
  id: "005",
  order: 1210,
  sql: relocateDamatRelations([
    "_damat_job_runs",
    "_damat_job_attempts",
    "_damat_job_activity",
    "_damat_job_logs",
    "_damat_job_schedules",
    "_damat_job_schedule_activity",
    "_damat_job_deduplication",
  ]),
};
