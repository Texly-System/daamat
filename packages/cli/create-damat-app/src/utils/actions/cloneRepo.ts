import fs from "fs";
import type { Spinner } from "yocto-spinner";
import path from "path";
import { isAbortError } from "../commands/createAbortController";
import execute from "../commands/executor";
import logMessage from "../logger/message";
import { execFileSync } from "child_process";

type CloneRepoOptions = {
  directoryName?: string;
  repoUrl?: string;
  abortController?: AbortController;
  verbose?: boolean;
  isModule?: boolean;
};

const DEFAULT_REPO = "https://github.com/damatjs/damat-starter-default";
const DEFAULT_MODULE_REPO =
  "https://github.com/damatjs/damat-starter-module";

export default async function cloneRepo({
  directoryName = "",
  repoUrl,
  abortController,
  verbose = false,
  isModule = false,
}: CloneRepoOptions) {
  const defaultRepo = isModule ? DEFAULT_MODULE_REPO : DEFAULT_REPO;

  await execute(
    [
      `git clone ${repoUrl || defaultRepo} ${directoryName} --depth 1`,
      {
        signal: abortController?.signal,
      },
    ],
    { verbose },
  );
}

export async function runCloneRepo({
  projectName,
  repoUrl,
  abortController,
  spinner,
  verbose = false,
  isModule = false,
}: {
  projectName: string;
  repoUrl: string;
  abortController: AbortController;
  spinner: Spinner;
  verbose?: boolean;
  isModule?: boolean;
}) {
  try {
    await cloneRepo({
      directoryName: projectName,
      repoUrl,
      abortController,
      verbose,
      isModule,
    });

    deleteGitDirectory(projectName);
    initializeFreshGit({ abortController, verbose });
  } catch (e) {
    if (isAbortError(e)) {
      process.exit();
    }

    spinner.stop();
    logMessage({
      message: `An error occurred while setting up your project: ${e}`,
      type: "error",
    });
  }
}

function deleteGitDirectory(projectDirectory: string) {
  try {
    fs.rmSync(path.join(projectDirectory, ".git"), {
      recursive: true,
      force: true,
    });
  } catch (error) {
    deleteWithCommand(projectDirectory, ".git");
  }

  try {
    fs.rmSync(path.join(projectDirectory, ".github"), {
      recursive: true,
      force: true,
    });
  } catch (error) {
    deleteWithCommand(projectDirectory, ".github");
  }
}

/**
 * Useful for deleting directories when fs methods fail (e.g., with Yarn v3)
 */
function deleteWithCommand(projectDirectory: string, dirName: string) {
  const dirPath = path.normalize(path.join(projectDirectory, dirName));
  if (!fs.existsSync(dirPath)) {
    return;
  }

  if (process.platform === "win32") {
    execFileSync("cmd", ["/c", "rmdir", "/s", "/q", dirPath]);
  } else {
    execFileSync("rm", ["-rf", dirPath]);
  }
}

export async function initializeFreshGit({
  abortController,
  verbose = false,
  initialMessage = "chore: bootstrap project structure",
  branchName = "main",
}: {
  abortController?: AbortController;
  verbose?: boolean;
  initialMessage?: string;
  branchName?: string;
}) {
  const execOptions = {
    signal: abortController?.signal,
  };

  const run = (command: string) => execute([command, execOptions], { verbose });

  try {
    await run(`git init -b ${branchName}`);
  } catch (err) {
    if (verbose) {
      console.warn("No changes to initialize.");
    }
  }

  try {
    await run(`git add .`);
  } catch (err) {
    if (verbose) {
      console.warn("No changes to add.");
    }
  }

  try {
    await run(`git commit -m "${initialMessage}"`);
  } catch (err) {
    if (verbose) {
      console.warn("No changes to commit.");
    }
  }
}
