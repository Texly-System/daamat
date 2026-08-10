import { statSync } from "node:fs";
import { join } from "node:path";

const INDEX_FILES = ["index.ts", "index.js"] as const;

export function resolveProviderEntry(path: string): string {
  let stat: ReturnType<typeof statSync>;
  try {
    stat = statSync(path);
  } catch {
    throw new Error(`Provider path does not exist: ${path}`);
  }
  if (stat.isFile()) return path;
  if (!stat.isDirectory())
    throw new Error(`Provider path is not a file or directory: ${path}`);
  for (const file of INDEX_FILES) {
    const entry = join(path, file);
    try {
      if (statSync(entry).isFile()) return entry;
    } catch {
      // Try the next conventional entry.
    }
  }
  throw new Error(`Provider directory has no index.ts or index.js: ${path}`);
}

export function isProviderEntry(path: string): boolean {
  try {
    resolveProviderEntry(path);
    return true;
  } catch {
    return false;
  }
}
