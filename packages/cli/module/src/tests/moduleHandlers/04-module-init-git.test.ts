import { beforeEach, describe, expect, it } from "bun:test";
import { createContext } from "../helpers";
import { spawnSyncCalls, state, writeCalls } from "../setup";
import { resetHandlerFixture } from "./fixture";

beforeEach(resetHandlerFixture);

const command = async () =>
  (await import("../../commands/module/init")).moduleInitCommand;

function run(options: Record<string, unknown>) {
  return createContext(
    { databaseSetup: false, install: false, ...options },
    { args: ["inventory"], cwd: "/m" },
  );
}

describe("module init Git setup", () => {
  it("documents the opt-out in usage, options, and examples", async () => {
    const cmd = await command();
    expect(cmd.usage).toContain("--no-git");
    expect(cmd.options?.find(({ name }) => name === "git")).toMatchObject({
      type: "boolean",
      default: true,
    });
    expect(cmd.examples?.join("\n")).toContain("--no-git");
  });

  it("initializes main and commits the scaffold by default", async () => {
    const { ctx } = run({ git: true });
    expect((await (await command()).handler(ctx)).exitCode).toBe(0);
    expect(spawnSyncCalls.map(({ cmd, args }) => [cmd, ...args])).toEqual([
      ["git", "--version"],
      ["git", "init", "-b", "main"],
      ["git", "add", "."],
      ["git", "commit", "-m", "chore: scaffold damat module"],
    ]);
    expect(writeCalls.some(({ path }) => path.endsWith("/AGENTS.md"))).toBe(
      true,
    );
  });

  it("does not probe Git when --no-git is selected", async () => {
    const { ctx } = run({ git: false });
    expect((await (await command()).handler(ctx)).exitCode).toBe(0);
    expect(spawnSyncCalls).toHaveLength(0);
  });

  it("warns and keeps the scaffold when Git is unavailable", async () => {
    state.spawnSyncResult = { status: 1 };
    const { ctx, logger } = run({ git: true });
    expect((await (await command()).handler(ctx)).exitCode).toBe(0);
    expect(spawnSyncCalls).toHaveLength(1);
    expect(logger.warn.mock.calls[0]?.[0]).toContain("git is not installed");
    expect(writeCalls.length).toBeGreaterThan(0);
  });

  it("treats a throwing Git probe as unavailable", async () => {
    state.spawnSyncErrors = [true];
    const { ctx, logger } = run({ git: true });
    expect((await (await command()).handler(ctx)).exitCode).toBe(0);
    expect(spawnSyncCalls).toHaveLength(1);
    expect(logger.warn.mock.calls[0]?.[0]).toContain("git is not installed");
  });

  it("treats init, add, and commit failures as warnings", async () => {
    for (const failureAt of [1, 2, 3]) {
      resetHandlerFixture();
      state.spawnSyncResults = [
        ...Array.from({ length: failureAt }, () => ({ status: 0 })),
        { status: 1 },
      ];
      const { ctx, logger } = run({ git: true });
      expect((await (await command()).handler(ctx)).exitCode).toBe(0);
      expect(logger.warn).toHaveBeenCalled();
      expect(writeCalls.length).toBeGreaterThan(0);
    }
  });
});
