import fs from "node:fs";
import type { Pool } from "@damatjs/deps/pg";
import type { OrmModule } from "@damatjs/orm-type";
import { discoverModuleMigrations } from "../discovery";
import { MigrationTracker } from "../tracker";
import { migrationChecksum, nonTransactionalConstruct } from "./checksum";
import { MigrationAdoptionError } from "./errors";

export interface AdoptMigrationOptions {
  checksum: string;
  actor: string;
  reason: string;
}

export async function adoptMigration(
  pool: Pool,
  module: OrmModule,
  migrationName: string,
  options: AdoptMigrationOptions,
): Promise<void> {
  const name = migrationName.replace(/\.sql$/, "");
  const migration = discoverModuleMigrations(module).find(
    (item) => item.name === name,
  );
  if (!migration)
    throw new MigrationAdoptionError(`Migration '${name}' was not found`);
  const source = fs.readFileSync(migration.path, "utf8");
  if (!nonTransactionalConstruct(source)) {
    throw new MigrationAdoptionError(`Migration '${name}' is transactional`);
  }
  const checksum = migrationChecksum(source);
  if (checksum !== options.checksum.toLowerCase()) {
    throw new MigrationAdoptionError(
      `Checksum mismatch for migration '${name}'`,
    );
  }
  const tracker = new MigrationTracker(pool);
  await tracker.ensureTable();
  if (
    (await tracker.getApplied(module.name)).some((row) => row.name === name)
  ) {
    throw new MigrationAdoptionError(`Migration '${name}' is already applied`);
  }
  const recorded = await tracker.recordAdopted(
    module.name,
    name,
    checksum,
    options.actor,
    options.reason,
  );
  if (!recorded)
    throw new MigrationAdoptionError(`Migration '${name}' is already applied`);
}
