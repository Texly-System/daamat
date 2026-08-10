import type { CommandOption } from "../types";

export function setParsedOption(
  options: Record<string, unknown>,
  occurrences: Set<string>,
  def: CommandOption,
  value: unknown,
): void {
  if (!def.repeatable || !occurrences.has(def.name)) {
    options[def.name] = value;
    occurrences.add(def.name);
    return;
  }
  const previous = options[def.name];
  options[def.name] = Array.isArray(previous)
    ? [...previous, value]
    : [previous, value];
}
