import { expect, test } from "bun:test";
import { runCli } from "../run";
import type { Command, CommandContext } from "../types";
import { createRuntimeFixture } from "./runtimeFixture";

test("runCli preserves repeatable values through nested dispatch and coercion", async () => {
  let context: CommandContext | undefined;
  const add: Command = {
    name: "add",
    description: "add",
    options: [
      {
        name: "target",
        type: "string",
        description: "target",
        repeatable: true,
      },
    ],
    handler: async (value) => {
      context = value;
      return { exitCode: 0 };
    },
  };
  const module: Command = {
    name: "module",
    description: "module",
    subcommands: [add],
    handler: async () => ({ exitCode: 0 }),
  };
  const fixture = createRuntimeFixture([
    "module",
    "add",
    "--target",
    "routes=src/http",
    "--target=jobs=src/workers",
  ]);
  const result = await runCli(
    { name: "cli", version: "1", commands: [module] },
    fixture.runtime,
  );
  expect(result).toEqual({ exitCode: 0, command: "module:add" });
  expect(context?.options.target).toEqual([
    "routes=src/http",
    "jobs=src/workers",
  ]);
});
