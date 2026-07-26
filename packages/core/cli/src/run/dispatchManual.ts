import type {
  CliDefinition,
  CliRunResult,
  CliRuntime,
  Command,
  CommandRegistry,
} from "../types";
import { printCommandSpecificHelp } from "../help";
import { parseCommandArgs } from "./buildCommand";
import { runCommand, type ProjectConfigAccessor } from "./runCommand";

interface Resolved {
  command: Command;
  name: string;
  consumed: number;
}

function resolve(
  args: readonly string[],
  registry: CommandRegistry,
): Resolved | undefined {
  const first = args[0];
  if (!first) return undefined;
  let command = registry.get(first);
  if (!command) return undefined;
  let name = command.name;
  let consumed = 1;
  while (command.subcommands && args[consumed]) {
    const token = args[consumed]!;
    if (token.startsWith("-") || token === "--") break;
    const childName = `${name}:${token}`;
    const child = registry.get(childName);
    if (!child || child === command) break;
    command = child;
    name = childName;
    consumed++;
  }
  return { command, name, consumed };
}

export async function dispatchManual(
  definition: CliDefinition,
  runtime: CliRuntime,
  registry: CommandRegistry,
  project?: ProjectConfigAccessor,
  globalOptions: Record<string, unknown> = {},
): Promise<CliRunResult | undefined> {
  const resolved =
    resolve(runtime.args, registry) ??
    (definition.defaultCommand
      ? (() => {
          const command = registry.get(definition.defaultCommand!);
          return command
            ? { command, name: definition.defaultCommand!, consumed: 0 }
            : undefined;
        })()
      : undefined);
  if (!resolved) return undefined;
  const args = runtime.args.slice(resolved.consumed);
  const terminator = args.indexOf("--");
  const optionArgs = terminator < 0 ? args : args.slice(0, terminator);
  if (optionArgs.some((arg) => arg === "-h" || arg === "--help")) {
    printCommandSpecificHelp(definition, resolved.command, runtime.output);
    return { exitCode: 0, command: resolved.name };
  }
  const parsed = parseCommandArgs(args, resolved.command.options);
  if (parsed.unknown.length) {
    runtime.logger.error(`Unknown option: ${parsed.unknown[0]}`);
    return { exitCode: 1, command: resolved.name };
  }
  return runCommand(
    resolved.command,
    resolved.name,
    parsed.positional,
    { ...parsed.options, ...globalOptions },
    definition,
    runtime,
    project,
  );
}
