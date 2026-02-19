import createSpinner, { type Spinner } from "yocto-spinner";
import path from "path";
import createAbortController from "../commands/createAbortController";
import { FactBoxOptions } from "../commands/facts";
import ProcessManager from "../commands/manager";
import PackageManager from "../package/manager";

export interface ProjectOptions {
  module?: boolean;
  repoUrl?: string | null;
  version?: string;
  directoryPath: string;
  verbose?: boolean;
}

export interface ProjectCreator {
  create(): Promise<void>;
}

// Base class for common project functionality
export abstract class BaseProjectCreator {
  protected spinner: Spinner;
  protected processManager: ProcessManager;
  protected packageManager: PackageManager;
  protected abortController: AbortController;
  protected factBoxOptions: FactBoxOptions;
  protected projectName: string;
  protected projectPath: string;
  protected isProjectCreated: boolean = false;
  protected printedMessage: boolean = false;

  constructor(
    projectName: string,
    protected options: ProjectOptions,
    protected args: string[],
  ) {
    this.spinner = createSpinner({ text: "" });
    this.processManager = new ProcessManager();
    this.packageManager = new PackageManager(this.processManager, {
      verbose: options.verbose || false,
    });
    this.abortController = createAbortController(this.processManager);
    this.projectName = projectName;
    const basePath =
      typeof options.directoryPath === "string" ? options.directoryPath : "";
    this.projectPath = path.join(basePath, projectName);

    this.factBoxOptions = {
      interval: null,
      spinner: this.spinner,
      processManager: this.processManager,
      message: "",
      title: "",
      verbose: options.verbose || false,
    };
  }

  protected getProjectPath(projectName: string): string {
    return path.join(this.options.directoryPath ?? "", projectName);
  }

  protected abstract showSuccessMessage(): void;

  protected abstract setupProcessManager(): void;
}
