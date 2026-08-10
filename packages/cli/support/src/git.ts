import { spawnSync } from "node:child_process";
import type { CliLogger } from "@damatjs/cli";

export function gitAvailable(): boolean {
  try {
    const result = spawnSync("git", ["--version"], {
      stdio: "pipe",
      encoding: "utf-8",
    });
    return !result.error && result.status === 0;
  } catch {
    return false;
  }
}

export function requireGit(what: string): string | null {
  if (gitAvailable()) return null;
  return (
    `git is required to ${what} but was not found on PATH — ` +
    "install git and re-run (the damat CLI uses your system git; " +
    "it never installs its own)"
  );
}

function runGit(target: string, args: string[]): boolean {
  try {
    const result = spawnSync("git", args, {
      cwd: target,
      stdio: "pipe",
      encoding: "utf-8",
    });
    return !result.error && result.status === 0;
  } catch {
    return false;
  }
}

const recovery = (message: string) =>
  `cd into the scaffold directory, then run \`git init -b main\`, ` +
  `\`git add .\`, and \`git commit -m "${message}"\``;

export function initializeGit(
  target: string,
  logger: CliLogger,
  commitMessage = "chore: scaffold damat app",
): boolean {
  if (!gitAvailable()) {
    logger.warn(
      `git is not installed — scaffold is complete; install git and ${recovery(commitMessage)}`,
    );
    return false;
  }
  const steps = [
    { args: ["init", "-b", "main"], label: "git init" },
    { args: ["add", "."], label: "git add" },
    { args: ["commit", "-m", commitMessage], label: "git commit" },
  ];
  for (const step of steps) {
    if (!runGit(target, step.args)) {
      logger.warn(
        `Could not initialize git (${step.label} failed) — scaffold is complete; ${recovery(commitMessage)}`,
      );
      return false;
    }
  }
  logger.success("Initialized git repository");
  return true;
}
