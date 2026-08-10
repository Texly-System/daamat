import type { Command } from "@damatjs/cli";
import { databaseSetupOptions } from "@damatjs/cli-support";
import { handleModuleInit } from "./handler";

export const moduleInitCommand: Command = {
  name: "init",
  description: "Scaffold a new standalone module package",
  usage:
    "damat module init <name> [--database-url <url>] [--no-database-setup] [--no-git] [--no-install]",
  examples: [
    "damat module init inventory",
    "damat module init inventory --no-git   # scaffold without a repository",
    "damat module init inventory --no-install   # install later",
  ],
  options: [
    ...databaseSetupOptions,
    {
      name: "dir",
      alias: "d",
      type: "string",
      description: "Directory to create the package in (default: ./<name>)",
    },
    {
      name: "install",
      type: "boolean",
      default: true,
      description: "Run bun install (use --no-install to defer)",
    },
    {
      name: "git",
      type: "boolean",
      default: true,
      description:
        "Initialize a git repository with an initial commit (use --no-git to skip)",
    },
  ],
  handler: handleModuleInit,
};
