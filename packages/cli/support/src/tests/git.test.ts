import { beforeEach, describe, expect, mock, test } from "bun:test";
import { mockSpawnSync, resetSupportMocks, state } from "./setup";
import { gitAvailable, initializeGit, requireGit } from "../git";

beforeEach(resetSupportMocks);

describe("gitAvailable", () => {
  test("detects a successful git binary", () => {
    expect(gitAvailable()).toBe(true);
  });

  test("rejects non-zero and process errors", () => {
    state.spawnSyncResult = { status: 1 };
    expect(gitAvailable()).toBe(false);
    state.spawnSyncResult = { status: null, error: new Error("missing") };
    expect(gitAvailable()).toBe(false);
  });

  test("rejects a thrown spawn", () => {
    mockSpawnSync.mockImplementationOnce(() => {
      throw new Error("failed");
    });
    expect(gitAvailable()).toBe(false);
  });
});

describe("requireGit", () => {
  test("returns null when git is available", () => {
    expect(requireGit("clone repositories")).toBeNull();
  });

  test("returns installation guidance when git is missing", () => {
    state.spawnSyncResult = { status: 1 };
    expect(requireGit("clone repositories")).toContain(
      "git is required to clone repositories",
    );
  });
});

function logger() {
  return {
    debug: mock(),
    info: mock(),
    success: mock(),
    skip: mock(),
    warn: mock(),
    error: mock(),
  };
}

describe("initializeGit", () => {
  test("initializes main, stages the scaffold, and commits", () => {
    const output = logger();
    expect(initializeGit("/tmp/module", output)).toBe(true);
    expect(state.spawnSyncResult.status).toBe(0);
    expect(mockSpawnSync.mock.calls.map(([cmd, args]) => [cmd, ...args])).toEqual(
      [
        ["git", "--version"],
        ["git", "init", "-b", "main"],
        ["git", "add", "."],
        ["git", "commit", "-m", "chore: scaffold damat app"],
      ],
    );
    expect(output.success).toHaveBeenCalledWith("Initialized git repository");
  });

  test("warns without mutating when the probe fails", () => {
    state.spawnSyncResult = { status: 1 };
    const output = logger();
    expect(initializeGit("/tmp/module", output)).toBe(false);
    expect(mockSpawnSync).toHaveBeenCalledTimes(1);
    expect(output.warn.mock.calls[0]?.[0]).toContain("git is not installed");
  });

  test("keeps the scaffold when a setup step fails", () => {
    mockSpawnSync
      .mockImplementationOnce(() => ({ status: 0 }) as never)
      .mockImplementationOnce(() => ({ status: 1 }) as never);
    const output = logger();
    expect(initializeGit("/tmp/module", output, "chore: scaffold module")).toBe(
      false,
    );
    expect(mockSpawnSync).toHaveBeenCalledTimes(2);
    expect(output.warn.mock.calls[0]?.[0]).toContain("Could not initialize git");
  });

  test("treats a thrown setup command as a warning", () => {
    mockSpawnSync
      .mockImplementationOnce(() => ({ status: 0 }) as never)
      .mockImplementationOnce(() => {
        throw new Error("git init failed");
      });
    const output = logger();
    expect(initializeGit("/tmp/module", output)).toBe(false);
    expect(output.warn.mock.calls[0]?.[0]).toContain("Could not initialize git");
  });
});
