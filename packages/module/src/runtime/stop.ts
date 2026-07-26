import {
  getLogger,
  runServiceShutdownHandlers,
  type ServiceInstances,
} from "@damatjs/framework/services";
import { closeServer } from "./server";
import type { ModuleServerHandle } from "./types";

async function closeHttp(
  server: ModuleServerHandle,
  graceMs?: number,
): Promise<void> {
  const task = closeServer(server);
  if (graceMs === undefined) return task;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`HTTP shutdown timed out after ${graceMs}ms`)),
      graceMs,
    );
  });
  await Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}

export function moduleStop(
  server: ModuleServerHandle,
  services: ServiceInstances,
  graceMs?: number,
): () => Promise<void> {
  let stopping: Promise<void> | undefined;
  return () => {
    stopping ??= (async () => {
      try {
        await closeHttp(server, graceMs);
      } catch (error) {
        getLogger().error(
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        await runServiceShutdownHandlers(
          services.shutdownHandlers,
          getLogger(),
          graceMs === undefined ? {} : { graceMs },
        );
      }
    })();
    return stopping;
  };
}
