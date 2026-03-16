/**
 * CLI Command Types
 *
 * Shared types and utilities for command handlers.
 */

/**
 * Command handler result
 */
export interface CommandResult {
  /** Exit code (0 = success, 1 = error) */
  exitCode: number;
}

/**
 * Assert that DATABASE_URL is set before attempting a DB connection.
 * Returns the URL string on success, or throws a CommandResult to short-circuit.
 */
export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("");
    console.error("  ERROR  DATABASE_URL is not set.");
    console.error("");
    console.error("  Make sure you have a .env file with:");
    console.error(
      "    DATABASE_URL=postgresql://user:password@localhost:5432/mydb",
    );
    console.error("");
    console.error("  Or export it before running:");
    console.error(
      "    export DATABASE_URL=postgresql://user:password@localhost:5432/mydb",
    );
    console.error("");
    process.exit(1);
  }
  return url;
}
