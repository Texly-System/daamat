/**
 * Revert Command
 *
 * Revert migrations for a specific module.
 */

import { Pool } from "@damatjs/deps/pg";
import type { CliOptions } from "../../types";
import { revertMigrations } from "../../executor";
import { resolveModules } from "../../discovery";
import { log, successBanner, errorBanner } from "../../logger";
import { DEFAULT_MODULES_DIR } from "../../generator";
import type { CommandResult } from "./types";

/**
 * Revert migrations for a module.
 */
export async function commandRevert(
  options: CliOptions,
  args: string[],
): Promise<CommandResult> {
  const modulesDir = options.modulesDir ?? DEFAULT_MODULES_DIR;

  const moduleName = args.find((a) => !a.startsWith("--"));
  const allFlag = args.includes("--all");
  const countArg = args.find((a) => /^\d+$/.test(a));

  if (!moduleName) {
    log("error", "Module name is required");
    console.error("");
    console.error("Usage: npm run db:migrate:revert <module> [count] [--all]");
    console.error("");
    console.error("Modules with migrations:");

    const found = resolveModules(modulesDir, options.activeModules);
    if (found.length > 0) {
      for (const m of found) {
        console.error(`  - ${m}`);
      }
    } else {
      console.error("  (no modules found)");
    }

    return { exitCode: 1 };
  }

  console.log("");
  log("info", `Reverting migrations for module '${moduleName}'...`);
  console.log("");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const count = allFlag ? 9999 : countArg ? parseInt(countArg, 10) : 1;
    const result = await revertMigrations(pool, modulesDir, moduleName, count);

    console.log("");

    if (result.success) {
      successBanner("Revert completed successfully");
      log("info", `Reverted: ${result.reverted.length}`);
    } else {
      errorBanner("Revert failed");
    }

    return { exitCode: result.success ? 0 : 1 };
  } finally {
    await pool.end();
  }
}
