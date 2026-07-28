import { expect, test } from "bun:test";
import { join } from "node:path";

test("plans and adds a Bun-style local module into backend capability roots", async () => {
  const script = join(
    import.meta.dir,
    "fixtures/localWorkspaceInstallCheck.ts",
  );
  const worker = new Worker(script);
  const result = await new Promise<unknown>((resolve, reject) => {
    worker.onmessage = (event) => resolve(event.data);
    worker.onerror = (event) => reject(event.error ?? new Error(event.message));
  });
  worker.terminate();
  expect(result).toEqual({
    planned: true,
    added: true,
    installed: true,
    owned: true,
    dependencyLinkPreserved: true,
    operations: true,
  });
});
