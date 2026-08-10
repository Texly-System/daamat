import type { PoolClient } from "@damatjs/deps/pg";

export async function seedLegacyRows(client: PoolClient): Promise<void> {
  const statements = [
    `INSERT INTO "_damat_idempotency_keys" ("scope","key","status","result","operation") VALUES ('legacy','upgrade','completed','{"ok":true}','{}')`,
    `INSERT INTO "_damat_workers" ("id","capabilities","hostname","process_id") VALUES ('legacy-worker','["jobs"]','legacy',1)`,
    `INSERT INTO "_damat_work_controls" ("work_kind","scope","paused","actor") VALUES ('job','legacy',TRUE,'{"id":"legacy"}')`,
    `INSERT INTO "_damat_work_control_activity" ("work_kind","scope","action","actor") VALUES ('job','legacy','paused','{"id":"legacy"}')`,
    `INSERT INTO "_damat_maintenance_activity" ("operation","status","actor") VALUES ('legacy-upgrade','requested','{"id":"legacy"}')`,
    `INSERT INTO "_damat_acceleration_outbox" ("id","topic","resource_kind") VALUES ('00000000-0000-0000-0000-000000000001','legacy.ready','job')`,
    `INSERT INTO "_damat_retention_overrides" ("work_kind","scope","retention_ms","actor","reason") VALUES ('job','legacy',1000,'{"id":"legacy"}','upgrade fixture')`,
    `INSERT INTO "_damat_job_runs" ("id","name","queue","payload") VALUES ('00000000-0000-0000-0000-000000000101','legacy-job','default','{}')`,
    `INSERT INTO "_damat_job_attempts" ("run_id","attempt_number","worker_id","lease_token") VALUES ('00000000-0000-0000-0000-000000000101',1,'legacy-worker','00000000-0000-0000-0000-000000000111')`,
    `INSERT INTO "_damat_job_activity" ("run_id","type","next_status") VALUES ('00000000-0000-0000-0000-000000000101','queued','queued')`,
    `INSERT INTO "_damat_job_logs" ("run_id","attempt_number","level","message","sequence") VALUES ('00000000-0000-0000-0000-000000000101',1,'info','legacy row',1)`,
    `INSERT INTO "_damat_job_schedules" ("id","name","job_name","kind","payload","queue") VALUES ('00000000-0000-0000-0000-000000000102','legacy-schedule','legacy-job','once','{}','default')`,
    `INSERT INTO "_damat_job_schedule_activity" ("schedule_id","type") VALUES ('00000000-0000-0000-0000-000000000102','created')`,
    `INSERT INTO "_damat_job_deduplication" ("queue","job_name","deduplication_key","run_id") VALUES ('default','legacy-job','legacy-key','00000000-0000-0000-0000-000000000101')`,
    `INSERT INTO "_damat_event_outbox" ("id","name","payload","retention_ms","retention_at") VALUES ('00000000-0000-0000-0000-000000000201','legacy.event','{}',60000,NOW()+INTERVAL '1 minute')`,
    `INSERT INTO "_damat_event_deliveries" ("id","event_id","consumer","retention_at") VALUES ('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000201','legacy-consumer',NOW()+INTERVAL '1 minute')`,
    `INSERT INTO "_damat_event_delivery_attempts" ("delivery_id","attempt_number","worker_id","lease_token") VALUES ('00000000-0000-0000-0000-000000000202',1,'legacy-worker','00000000-0000-0000-0000-000000000222')`,
    `INSERT INTO "_damat_event_activity" ("event_id","delivery_id","attempt_number","consumer","type") VALUES ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000202',1,'legacy-consumer','published')`,
    `INSERT INTO "_damat_event_logs" ("event_id","delivery_id","attempt_number","consumer","level","message","sequence") VALUES ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000202',1,'legacy-consumer','info','legacy event',1)`,
    `INSERT INTO "_damat_pipeline_definitions" ("id","name","source") VALUES ('00000000-0000-0000-0000-000000000301','legacy-pipeline','code')`,
    `INSERT INTO "_damat_pipeline_versions" ("id","definition_id","source_version","checksum","manifest") VALUES ('00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000301','1','legacy','{}')`,
    `UPDATE "_damat_pipeline_definitions" SET "active_version_id"='00000000-0000-0000-0000-000000000302' WHERE "id"='00000000-0000-0000-0000-000000000301'`,
    `INSERT INTO "_damat_pipeline_drafts" ("definition_id","manifest","actor","reason") VALUES ('00000000-0000-0000-0000-000000000301','{}','{"id":"legacy"}','upgrade fixture')`,
    `INSERT INTO "_damat_pipeline_layouts" ("id","version_id","revision","layout","actor","reason") VALUES ('00000000-0000-0000-0000-000000000307','00000000-0000-0000-0000-000000000302',1,'{}','{"id":"legacy"}','upgrade fixture')`,
    `INSERT INTO "_damat_pipeline_runs" ("id","definition_id","version_id","status","input") VALUES ('00000000-0000-0000-0000-000000000303','00000000-0000-0000-0000-000000000301','00000000-0000-0000-0000-000000000302','running','{}')`,
    `INSERT INTO "_damat_pipeline_node_executions" ("id","run_id","node_id","kind","status") VALUES ('00000000-0000-0000-0000-000000000304','00000000-0000-0000-0000-000000000303','legacy-node','workflow','ready')`,
    `INSERT INTO "_damat_pipeline_transitions" ("run_id","reason") VALUES ('00000000-0000-0000-0000-000000000303','legacy transition')`,
    `INSERT INTO "_damat_pipeline_signals" ("id","run_id","name","payload","idempotency_key","actor","reason","consumed_by","consumed_at") VALUES ('00000000-0000-0000-0000-000000000305','00000000-0000-0000-0000-000000000303','legacy.signal','{}','legacy-key','{"id":"legacy"}','upgrade fixture','00000000-0000-0000-0000-000000000304',NOW())`,
    `INSERT INTO "_damat_pipeline_trigger_receipts" ("id","version_id","trigger_id","source_id","run_id") VALUES ('00000000-0000-0000-0000-000000000306','00000000-0000-0000-0000-000000000302','legacy-trigger','legacy-source','00000000-0000-0000-0000-000000000303')`,
    `INSERT INTO "_damat_pipeline_schedules" ("version_id","trigger_id","next_at") VALUES ('00000000-0000-0000-0000-000000000302','legacy-trigger',NOW())`,
    `INSERT INTO "_damat_pipeline_trigger_controls" ("version_id","trigger_id","actor","reason") VALUES ('00000000-0000-0000-0000-000000000302','legacy-trigger','{"id":"legacy"}','upgrade fixture')`,
    `INSERT INTO "_damat_pipeline_activity" ("run_id","node_execution_id","type") VALUES ('00000000-0000-0000-0000-000000000303','00000000-0000-0000-0000-000000000304','started')`,
  ];
  for (const statement of statements) await client.query(statement);
}
