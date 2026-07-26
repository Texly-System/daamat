import type { CliRuntime, CommandContext, CommandOption } from "../types";
import { extractPositionalArgs } from "./extractPositional";
export { extractPositionalArgs } from "./extractPositional";

/**
 * Parse raw argv tokens against a command's option definitions.
 * Supports --name value, --name=value, -a value, boolean flags, and
 * `--no-name` negation of boolean flags (mirrors cac's top-level parsing).
 */
export function parseCommandArgs(
  args: string[],
  optionDefs: CommandOption[] = [],
): {
  options: Record<string, unknown>;
  positional: string[];
  unknown: string[];
} {
  const options: Record<string, unknown> = {};
  const positional: string[] = [];
  const unknown: string[] = [];

  for (const def of optionDefs) {
    if (def.default !== undefined) {
      options[def.name] = def.default;
    }
  }

  const findDef = (token: string): CommandOption | undefined => {
    const isLong = token.startsWith("--");
    const name = token.replace(/^--?/, "");
    return optionDefs.find((d) =>
      isLong ? d.name === name : d.alias === name,
    );
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === "--") {
      positional.push(...args.slice(i + 1));
      break;
    }
    if (arg.startsWith("-")) {
      let token = arg;
      let inlineValue: string | undefined;
      const eqIndex = arg.indexOf("=");
      if (eqIndex !== -1) {
        token = arg.slice(0, eqIndex);
        inlineValue = arg.slice(eqIndex + 1);
      }

      // `--no-<name>` negates a boolean option.
      if (token.startsWith("--no-")) {
        const negated = optionDefs.find(
          (d) => d.type === "boolean" && d.name === token.slice(5),
        );
        if (negated) {
          options[negated.name] = false;
          continue;
        }
      }

      const def = findDef(token);
      if (!def) {
        unknown.push(token);
        continue;
      }

      if (def.type === "boolean") {
        options[def.name] =
          inlineValue !== undefined ? inlineValue !== "false" : true;
      } else {
        const value = inlineValue ?? args[++i];
        if (value === undefined) continue;
        options[def.name] = def.type === "number" ? Number(value) : value;
      }
    } else {
      positional.push(arg);
    }
  }

  return { options, positional, unknown };
}

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
