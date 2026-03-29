/**
 * Migration CLI
 *
 * Main entry point for the migration command-line interface.
 * Reads DATABASE_URL from environment via dotenv.
 * The sub-command is taken from process.argv[2]; all further positional
 * arguments are forwarded to the individual command handlers.
 */

import "dotenv/config";
import {
  commandUp,
  commandStatus,
  commandCreate,
  commandList,
  commandHelp,
  commandUnknown,
} from "./commands";
import { log } from "../logger";
import type { CliOptions } from "../types";

/**
 * Run the migration CLI.
 *
 * The sub-command and its arguments are read directly from process.argv so
 * callers only need to supply environment-level configuration (modulesDir,
 * activeModules).  This lets the package be used as a proper CLI binary via
 * the `damat-migrate` bin entry as well as programmatically from a project
 * script without having to forward argv manually.
 *
 * @param options - Optional CLI configuration (modulesDir, activeModules)
 *
 * @example
 * ```typescript
 * // Used from a project script that just configures the environment:
 * import { runCli } from '@damatjs/orm-migration';
 *
 * runCli({
 *   modulesDir: 'src/modules',     // optional, defaults to "src/modules"
 *   activeModules: ['user', 'billing'], // optional, defaults to all modules
 * });
 * ```
 */
export async function runCli(options: CliOptions = {}): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  try {
    let result;

    switch (command) {
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

      case "list":
        result = await commandList(options);
        break;

      case "help":
      case "--help":
      case "-h":
        result = commandHelp();
        break;

      default:
        result = commandUnknown(command);
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
