import { beforeEach, describe, expect, test } from "bun:test";
import { createCommand } from "../commands/create";
import { createContext } from "./helpers";
import { resetMocks, spawnSyncCalls } from "./setup";

beforeEach(resetMocks);

function run(options: Record<string, unknown>) {
  const { ctx, logger } = createContext(
    { databaseSetup: false, install: false, ...options },
    { args: ["my-api"], cwd: "/base" } as never,
  );
  return { result: createCommand.handler(ctx), logger };
}

describe("create Git option", () => {
  test("documents the opt-out in usage, options, and examples", () => {
    expect(createCommand.usage).toContain("--no-git");
    expect(createCommand.options?.find(({ name }) => name === "git")).toMatchObject({
      type: "boolean",
      default: true,
    });
    expect(createCommand.examples?.join("\n")).toContain("--no-git");
  });

  test("--no-git skips the availability probe and setup commands", async () => {
    const { result } = run({ git: false });
    expect((await result).exitCode).toBe(0);
    expect(spawnSyncCalls).toHaveLength(0);
  });
});
