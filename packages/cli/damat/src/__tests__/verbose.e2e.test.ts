import { describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { within } from "./moduleDevUtils";

const INVOKE_TIMEOUT = 20_000;

async function invoke(args: string[]) {
  const child = Bun.spawn(
    [process.execPath, join(import.meta.dir, "../cli.ts"), ...args],
    {
      cwd: tmpdir(),
      env: { ...process.env, NO_COLOR: "1" },
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const stdout = new Response(child.stdout).text();
  const stderr = new Response(child.stderr).text();
  try {
    const code = await within(
      child.exited,
      INVOKE_TIMEOUT,
      "CLI invoke timed out",
    );
    return { code, output: `${await stdout}${await stderr}` };
  } catch (error) {
    child.kill("SIGKILL");
    await child.exited;
    await Promise.all([stdout, stderr]);
    throw error;
  }
}

describe("Damat global verbose option", () => {
  test.each([
    ["before commands", ["--verbose", "module", "dev"]],
    ["after commands", ["module", "dev", "--verbose"]],
  ])(
    "shows module failure stacks %s",
    async (_label, args) => {
      const result = await invoke(args);
      const summary = "Module development preflight failed:";
      const detail = "No damat.json or module.json found";
      expect(result.code).toBe(1);
      expect(result.output).toContain("Verbose mode enabled");
      expect(result.output).toContain("at locateModuleDir");
      expect(result.output).not.toContain("Unknown command");
      expect(result.output.match(new RegExp(summary, "g"))).toHaveLength(1);
      expect(result.output.match(new RegExp(detail, "g"))).toHaveLength(2);
    },
    45_000,
  );

  test("keeps stacks hidden without verbose", async () => {
    const result = await invoke(["module", "dev"]);
    expect(result.code).toBe(1);
    expect(result.output).toContain("Run again with --verbose");
    expect(result.output).not.toContain("at locateModuleDir");
  }, 45_000);
});
