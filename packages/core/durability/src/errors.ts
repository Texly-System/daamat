export class DurabilityNotConfiguredError extends Error {
  constructor() {
    super("Durability client is not configured");
    this.name = "DurabilityNotConfiguredError";
  }
}

export class IdempotencyInProgressError extends Error {
  constructor(scope: string, key: string) {
    super(`Idempotency operation is still running: ${scope}/${key}`);
    this.name = "IdempotencyInProgressError";
  }
}

export class IdempotencyConflictError extends Error {
  constructor(
    readonly scope: string,
    readonly key: string,
  ) {
    super(`Idempotency key conflicts with an existing intent: ${scope}/${key}`);
    this.name = "IdempotencyConflictError";
  }
}

export class TransactionalExecutorRequiredError extends Error {
  constructor(operation = "idempotency") {
    super(
      `A supplied ${operation} executor must be an active transaction executor`,
    );
    this.name = "TransactionalExecutorRequiredError";
  }
}

export class InactiveTransactionalExecutorError extends Error {
  constructor() {
    super("The active transaction for this executor has ended");
    this.name = "InactiveTransactionalExecutorError";
  }
}

export interface MissingSystemMigration {
  owner: string;
  id: string;
}

export class DurableInfrastructureNotMigratedError extends Error {
  readonly missing: readonly MissingSystemMigration[];

  constructor(missing: readonly MissingSystemMigration[], cause?: unknown) {
    super("Durable infrastructure is not migrated. Run: damat-orm migrate:up", {
      cause,
    });
    this.name = "DurableInfrastructureNotMigratedError";
    this.missing = missing;
  }
}
