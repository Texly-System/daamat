import { expect, test } from "bun:test";
import { runCapabilityTest } from "@damatjs/cli/testing";
import { moduleCliCapability } from "../capability";

test("the module capability exposes normal provider-module commands", async () => {
  expect(moduleCliCapability.commands.map((command) => command.name)).toEqual([
    "module",
  ]);
  const moduleRun = await runCapabilityTest(moduleCliCapability, ["--help"]);
  expect(moduleRun.output.join("\n")).toContain("module");
});

test("module install commands mark target as repeatable", () => {
  const module = moduleCliCapability.commands[0];
  const targets = module?.subcommands
    ?.filter((command) => ["add", "plan", "update"].includes(command.name))
    .map((command) => command.options?.find((option) => option.name === "target"));
  expect(targets?.every((option) => option?.repeatable === true)).toBe(true);
});
