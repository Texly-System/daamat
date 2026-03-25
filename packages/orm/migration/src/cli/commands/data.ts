/**
 * CLI Help Text
 *
 * Help text and usage information for the migration CLI.
 */

/**
 * Help text displayed for --help or unknown commands.
 */
export const HELP_TEXT = `
┌─────────────────────────────────────────────────────────────────┐
│                      damat-migrate                              │
├─────────────────────────────────────────────────────────────────┤
│  Module-based PostgreSQL migrations with UP/DOWN support        │
└─────────────────────────────────────────────────────────────────┘

Usage: damat-migrate [command] [args...]

Commands:
  (none), up              Run all pending migrations
  status [module]         Show detailed migration status
  create <module>         Create a new migration for a module
  revert <module> [count] Revert last N migrations for a module (default: 1)
  list                    List all modules with migrations
  help, --help, -h        Show this help text

Options for revert:
  --all                   Revert all migrations for the module

Examples:
  damat-migrate
  damat-migrate up
  damat-migrate status
  damat-migrate status user
  damat-migrate create user
  damat-migrate revert user
  damat-migrate revert user 3
  damat-migrate revert user --all
  damat-migrate list

Environment:
  DATABASE_URL        PostgreSQL connection string (required)

Documentation:
  See docs/MIGRATIONS.md for full documentation.
`;
