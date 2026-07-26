import { expect, test } from "bun:test";
import { moduleStop } from "../src/runtime/stop";

test("runs service cleanup when HTTP close fails", async () => {
  const cleaned: string[] = [];
  const server = {
    close(callback?: (error?: Error) => void) {
      callback?.(new Error("close failed"));
    },
  };
  const services = {
    shutdownHandlers: [
      {
        name: "cleanup",
        phase: "postgres",
        handler: async () => void cleaned.push("cleanup"),
      },
    ],
  };

  await moduleStop(server, services as never)();
  expect(cleaned).toEqual(["cleanup"]);
});

test("bounds HTTP close by the configured grace period", async () => {
  const server = { close() {} };
  await moduleStop(server, { shutdownHandlers: [] } as never, 0)();
});
