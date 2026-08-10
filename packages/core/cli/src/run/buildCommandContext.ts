import type { CliRuntime, CommandContext } from "../types";
import { extractPositionalArgs } from "./extractPositional";

export function buildCommandContext(
  commandName: string,
  rawArgs: readonly string[],
  options: Record<string, unknown>,
  runtime: Pick<CliRuntime, "cwd" | "logger">,
): CommandContext {
  return {
    command: commandName,
    args: extractPositionalArgs([...rawArgs]),
    options,
    logger: runtime.logger,
    cwd: runtime.cwd,
  };
}
