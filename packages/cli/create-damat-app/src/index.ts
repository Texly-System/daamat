#!/usr/bin/env bun
import { cac } from "cac";
import create from "./commands/create";
import { ProjectOptions } from './utils/projectCreator';

const cli = cac("create-damat-app");

cli
  .command("[project-name]", "Create a new damat project or module")
  .option("--module", "Create a module instead of a project")
  .option("--repo-url <url>", "URL of repository to setup project from")
  .option("--version <version>", "The version of damat packages to install")
  .option(
    "--directory-path <path>",
    "Specify the directory path to install the project in"
  )
  .option(
    "--verbose",
    "Show all logs. Useful for debugging"
  )
  .option("--use-bun", "Use bun as the package manager")
  .action((projectName: string | undefined, options: ProjectOptions) => {

    let directoryPath = options.directoryPath;
    if (!directoryPath) {
      directoryPath = process.cwd();
    }
    // Convert options to match expected format

    const normalizedOptions: ProjectOptions = {
      module: options.module ?? false,
      repoUrl: options.repoUrl ?? null,
      version: options.version ?? "latest",
      directoryPath: directoryPath,
      verbose: options.verbose ?? false,
    };

    const args = projectName ? [projectName] : [];
    void create(args, normalizedOptions);
  });

cli.help();
cli.version("0.0.1");
cli.parse();
