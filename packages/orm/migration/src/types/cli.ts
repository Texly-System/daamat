// =============================================================================
// CLI
// =============================================================================

/**
 * CLI options for migration commands.
 * Database connection is read from the DATABASE_URL environment variable.
 * The sub-command is read from process.argv[2] at runtime.
 */
export interface CliOptions {
  /** Path to modules directory (default: "src/modules") */
  modulesDir?: string;
  /**
   * Optional allowlist of module names to include.
   * - Omitted or empty → all modules with migrations are auto-discovered
   * - Non-empty → only modules in this list that also have migrations are used
   */
  activeModules?: string[];
}
