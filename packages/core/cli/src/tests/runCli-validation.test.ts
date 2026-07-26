import { expect, test } from "bun:test";
import { runCli } from "../run";
import type { CliDefinition } from "../types";

test("validates required CLI definition identity", async () => {
  await expect(
    runCli({ version: "1", commands: [] } as CliDefinition),
  ).rejects.toThrow("name");
  await expect(
    runCli({ name: "cli", commands: [] } as CliDefinition),
  ).rejects.toThrow("version");
});
