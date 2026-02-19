import path from "path"
import execute, { VerboseOptions } from "../commands/executor"
import logMessage from "../logger/message"
import ProcessManager from "../commands/manager"
import { existsSync, rmSync } from "fs"


type PackageManagerOptions = {
  verbose?: boolean
}

export default class PackageManager {
  protected packageManagerVersion?: string
  protected processManager: ProcessManager
  protected verbose

  constructor(
    processManager: ProcessManager,
    options: PackageManagerOptions = {}
  ) {
    this.processManager = processManager
    this.verbose = options.verbose || false
  }



  private async getVersion(
    execOptions: Record<string, unknown>
  ): Promise<string | undefined> {

    try {
      const result = await execute(["bun -v", execOptions], {
        verbose: false,
      })
      const version = result.stdout?.trim()
      if (this.verbose) {
        logMessage({
          type: "info",
          message: `Detected bun version: ${version}`,
        })
      }
      return version
    } catch {
      if (this.verbose) {
        logMessage({
          type: "info",
          message: `Failed to get version for package manager: bun`,
        })
      }
      return undefined
    }
  }

  async setPackageManager(execOptions: Record<string, unknown>): Promise<void> {
    // check whether package manager is available and get version
    await this.processManager.runProcess({
      process: async () => {
        const version = await this.getVersion(
          execOptions
        )

        if (version) {
          // Store version if we don't have it from user agent
          if (!this.packageManagerVersion) {
            this.packageManagerVersion = version
          }
          return
        }

        // Error logs exit the process, so command execution will stop here
        logMessage({
          type: "error",
          message: `damat currently only supports bun as a package manager. Please install it and try again.`,
        })
      },
      ignoreERESOLVE: true,
    })
  }

  async removeLockFiles(directory: string): Promise<void> {
    const lockFiles: string[] = ["bun.lock", "package-lock.json", "pnpm-lock.yaml", ".bun"];

    const filesToRemove = lockFiles || []
    for (const file of filesToRemove) {
      const filePath = path.join(directory, file)
      if (existsSync(filePath)) {
        rmSync(filePath, {
          force: true,
          recursive: true,
        })
      }
    }
  }

  async installDependencies(execOptions: Record<string, unknown>) {
    // Remove lock files from other package managers
    if (execOptions.cwd && typeof execOptions.cwd === "string") {
      await this.removeLockFiles(execOptions.cwd)
    }

    const command: string = "bun install"

    await this.processManager.runProcess({
      process: async () => {
        await execute([command, execOptions], {
          verbose: this.verbose,
        })
      },
      ignoreERESOLVE: true,
    })
  }

  async runCommand(
    command: string,
    execOptions: Record<string, unknown>,
    verboseOptions: VerboseOptions = {}
  ) {

    const commandStr = this.getCommandStr(command)

    return await this.processManager.runProcess({
      process: async () => {
        return await execute([commandStr, execOptions], {
          verbose: this.verbose,
          ...verboseOptions,
        })
      },
      ignoreERESOLVE: true,
    })
  }

  async rundamatCommand(

    command: string,
    execOptions: Record<string, unknown>,
    verboseOptions: VerboseOptions = {}
  ) {

    const commandStr = `bun run damat ${command}`

    return await this.processManager.runProcess({
      process: async () => {
        return await execute([commandStr, execOptions], {
          verbose: this.verbose,
          ...verboseOptions,
        })
      },
      ignoreERESOLVE: true,
    })
  }

  getCommandStr(command: string): string {
    const format: string = `bun run ${command}`;

    return format
  }


  async getPackageManagerString(): Promise<string | undefined> {
    if (!this.packageManagerVersion) {
      if (this.verbose) {
        logMessage({
          type: "info",
          message: `No version detected for package manager: bun}`,
        })
      }
      return undefined
    }
    const result = `bun@${this.packageManagerVersion}`
    if (this.verbose) {
      logMessage({
        type: "info",
        message: `Package manager string: ${result}`,
      })
    }
    return result
  }
}
