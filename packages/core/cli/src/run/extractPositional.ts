export function extractPositionalArgs(args: string[]): string[] {
  const positionalArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    if (arg === "--") {
      positionalArgs.push(...args.slice(i + 1));
      break;
    }
    if (arg.startsWith("-")) {
      i++;
      continue;
    }
    positionalArgs.push(arg);
  }
  return positionalArgs;
}
