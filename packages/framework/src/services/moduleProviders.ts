import { pathToFileURL } from "node:url";
import { resolveProviderEntry, type ResolvedModule } from "@damatjs/installer";

const PROVIDERS = ["workflows", "jobs", "events", "pipelines"] as const;

export async function loadModuleProviders(
  modules: Map<string, ResolvedModule>,
): Promise<void> {
  for (const [id, module] of modules) {
    for (const provider of PROVIDERS) {
      const path = module[provider];
      if (!path) continue;
      try {
        await import(pathToFileURL(resolveProviderEntry(path)).href);
      } catch (error) {
        throw new Error(
          `Failed to load ${provider} provider for "${id}": ${String(error)}`,
        );
      }
    }
  }
}
