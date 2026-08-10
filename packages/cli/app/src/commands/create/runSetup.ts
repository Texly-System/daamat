import { spawnSync } from "node:child_process";
import type { CliLogger } from "@damatjs/cli";

function run(cmd: string, args: string[], cwd: string): boolean {
  try {
    return (
      spawnSync(cmd, args, {
        cwd,
        stdio: "pipe",
        encoding: "utf-8",
      }).status === 0
    );
  } catch {
    return false;
  }
}

export { initializeGit } from "@damatjs/cli-support";

export function installDependencies(
  target: string,
  name: string,
  logger: CliLogger,
): boolean {
  logger.info("Installing dependencies (bun install)...");
  if (run("bun", ["install"], target)) {
    logger.success("Dependencies installed");
    return true;
  } else {
    logger.warn(
      `bun install failed — run it manually in ${name}/ (the scaffold itself is complete)`,
    );
    return false;
  }
}

export function setupDatabase(target: string, logger: CliLogger): boolean {
  logger.info("Creating PostgreSQL database and applying migrations...");
  if (run("bun", ["run", "db:setup"], target)) {
    logger.success("Database and durable infrastructure are ready");
    return true;
  }
  logger.error(
    "Database setup failed — verify PostgreSQL credentials, then run `bun run db:setup`",
  );
  return false;
}
