/**
 * Migration CLI
 *
 * Main entry point for the migration command-line interface.
 * Reads DATABASE_URL from environment via dotenv.
 */

import "dotenv/config";
import {
  commandUp,
  commandStatus,
  commandCreate,
  commandRevert,
  commandList,
  commandHelp,
  commandUnknown,
} from "./commands";
import { log } from "../logger";
import type { CliOptions } from "../types";

/**
 * Run the migration CLI.
 *
 * @param options - CLI configuration options
 *
 * @example
 * ```typescript
 * // scripts/db-migrate.ts
 * import { runCli } from '@damatjs/orm-migration';
 *
 * runCli({
 *   modulesDir: 'src/modules',     // optional, defaults to "src/modules"
 *   modules: ['user', 'billing'],
 *   command: process.env.MIGRATION_CMD ?? 'up',
 * });
 * ```
 */
export async function runCli(options: CliOptions): Promise<void> {
  const [...args] = process.argv.slice(2);

  try {
    let result;

    switch (options.command) {
      case undefined:
      case "migrate":
      case "up":
        result = await commandUp(options);
        break;

      case "status":
        result = await commandStatus(options, args);
        break;

      case "create":
        result = await commandCreate(options, args);
        break;

      case "revert":
        result = await commandRevert(options, args);
        break;

      case "list":
        result = await commandList(options);
        break;

      case "help":
      case "--help":
      case "-h":
        result = commandHelp();
        break;

      default:
        result = commandUnknown(options.command);
    }

    process.exit(result.exitCode);
  } catch (error) {
    console.error("");
    log(
      "error",
      `Unexpected error: ${error instanceof Error ? error.message : error}`,
    );
    console.error("");
    process.exit(1);
  }
}
