import { ConnectionManager } from "@damatjs/orm-connector";
import { PoolManager } from "@damatjs/services";
import { Logger } from "@damatjs/logger";
import { readModuleManifest } from "../manifest/read";
import type { ModuleManifest } from "../manifest/types";
import { resolveDatabaseConfig } from "./database";
import { applyModuleMigrations } from "./migrate";
import type { BootableModule, BootModuleOptions, BootedModule } from "./types";
import {
  clearDurabilityClient,
  createDurabilityClient,
  getDurabilityClientOrUndefined,
  setDurabilityClient,
} from "@damatjs/durability";
import { syncPipelineDefinitions } from "@damatjs/pipelines";
import { detectModuleCapabilities } from "../runtime/capabilities";

function restoreDurability(
  previous: ReturnType<typeof getDurabilityClientOrUndefined>,
) {
  if (previous) setDurabilityClient(previous);
  else clearDurabilityClient();
}

/**
 * Boot a module standalone — no backend app required.
 *
 * Wires the same infrastructure the framework uses in production
 * (ConnectionManager + PoolManager), optionally applies the module's own
 * migrations, and initializes the module. This is what makes a module
 * developable and testable in its own repository before it's ever added
 * to a backend.
 *
 */
export async function bootModule<TService extends object>(
  module: BootableModule<TService>,
  options: BootModuleOptions = {},
): Promise<BootedModule<TService>> {
  const logger =
    options.logger ?? new Logger({ prefix: "module", timestamp: false });

  const dbConfig = resolveDatabaseConfig(options);
  const connection = new ConnectionManager(dbConfig, logger);
  const pool = await connection.connect();

  // Fresh shared state for this boot — the harness owns the process
  PoolManager.reset();
  PoolManager.setup({ pool, logger, connectionManager: connection });

  let manifest: ModuleManifest | null = null;
  const previousDurability = getDurabilityClientOrUndefined();
  let ownsDurability = false;
  try {
    if (options.moduleDir) {
      manifest = readModuleManifest(options.moduleDir);
      await applyModuleMigrations(
        pool,
        options.moduleDir,
        manifest,
        logger,
        options.migrate,
      );
      const capabilities = detectModuleCapabilities(
        options.moduleDir,
        manifest,
      );
      if (capabilities.durable) {
        setDurabilityClient(createDurabilityClient({ pool }));
        ownsDurability = true;
      }
      await module.init();
      if (capabilities.pipelines) await syncPipelineDefinitions();
    } else {
      await module.init();
    }
  } catch (error) {
    if (ownsDurability) restoreDurability(previousDurability);
    PoolManager.reset();
    await connection.disconnect();
    throw error;
  }

  let teardown: Promise<void> | undefined;
  return {
    service: module.service,
    pool,
    connection,
    manifest,
    teardown: () =>
      (teardown ??= (async () => {
        if (ownsDurability) restoreDurability(previousDurability);
        PoolManager.reset();
        await connection.disconnect();
      })()),
  };
}
