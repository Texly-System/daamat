import {
  damatRelation,
  relocateDamatRelations,
} from "@damatjs/durability";

export const MIGRATION_TRACKER_TABLE = "_damat_migration_logs";
export const MIGRATION_TRACKER_RELATION = damatRelation(
  MIGRATION_TRACKER_TABLE,
);

export const MIGRATION_TRACKER_SCHEMA = `${relocateDamatRelations([
  MIGRATION_TRACKER_TABLE,
])}
CREATE TABLE IF NOT EXISTS ${MIGRATION_TRACKER_RELATION} (
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
ALTER TABLE ${MIGRATION_TRACKER_RELATION}
  ADD COLUMN IF NOT EXISTS "checksum" TEXT,
  ADD COLUMN IF NOT EXISTS "adopted_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "adoption_actor" TEXT,
  ADD COLUMN IF NOT EXISTS "adoption_reason" TEXT;
CREATE INDEX IF NOT EXISTS "idx__damat_migration_logs_module"
  ON ${MIGRATION_TRACKER_RELATION} ("module");
CREATE INDEX IF NOT EXISTS "idx__damat_migration_logs_status"
  ON ${MIGRATION_TRACKER_RELATION} ("status");
`;
