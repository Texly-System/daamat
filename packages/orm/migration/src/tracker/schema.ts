export const MIGRATION_TRACKER_TABLE = "_damat_migration_logs";

export const MIGRATION_TRACKER_SCHEMA = `
CREATE TABLE IF NOT EXISTS "${MIGRATION_TRACKER_TABLE}" (
  "id" TEXT PRIMARY KEY,
  "module" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "applied_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "reverted_at" TIMESTAMPTZ,
  "execution_time_ms" INTEGER,
  "checksum" TEXT,
  "adopted_at" TIMESTAMPTZ,
  "adoption_actor" TEXT,
  "adoption_reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'applied',
  UNIQUE ("module", "name")
);
ALTER TABLE "${MIGRATION_TRACKER_TABLE}"
  ADD COLUMN IF NOT EXISTS "checksum" TEXT,
  ADD COLUMN IF NOT EXISTS "adopted_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "adoption_actor" TEXT,
  ADD COLUMN IF NOT EXISTS "adoption_reason" TEXT;
CREATE INDEX IF NOT EXISTS "idx__damat_migration_logs_module"
  ON "_damat_migration_logs" ("module");
CREATE INDEX IF NOT EXISTS "idx__damat_migration_logs_status"
  ON "_damat_migration_logs" ("status");
`;
