export class CommittedMigrationUntrackedError extends Error {
  readonly code = "MIGRATION_COMMITTED_UNTRACKED";

  constructor(
    readonly moduleName: string,
    readonly migrationName: string,
    options?: ErrorOptions,
  ) {
    super(
      `Migration '${moduleName}/${migrationName}' committed but could not be tracked`,
      options,
    );
    this.name = "CommittedMigrationUntrackedError";
  }
}

export class MigrationAdoptionError extends Error {
  readonly code = "MIGRATION_ADOPTION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "MigrationAdoptionError";
  }
}
