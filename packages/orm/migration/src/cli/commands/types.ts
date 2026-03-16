/**
 * CLI Command Types
 *
 * Shared types for command handlers.
 */

/**
 * Command handler result
 */
export interface CommandResult {
  /** Exit code (0 = success, 1 = error) */
  exitCode: number;
}
