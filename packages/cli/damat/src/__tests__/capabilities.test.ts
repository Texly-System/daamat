import { expect, test } from "bun:test";
import { runCapabilityTest } from "@damatjs/cli/testing";
import { damatCapability, damatCommands } from "../capabilities";

test("Damat composes the exact compatible command order", async () => {
  expect(damatCommands.map(({ name }) => name)).toEqual([
    "create",
    "clone",
    "dev",
    "start",
    "build",
    "codegen",
    "barrel",
    "module",
    "kit",
  ]);
  expect(damatCommands.find(({ name }) => name === "module")?.aliases).toEqual([
    "m",
  ]);
  expect(
    damatCommands
      .find(({ name }) => name === "codegen")
      ?.options?.some(({ name }) => name === "all"),
  ).toBe(true);
  const run = await runCapabilityTest(damatCapability, ["--help"]);
  for (const command of damatCommands) {
    expect(run.output.join("\n")).toContain(command.name);
  }
});

test("composed creation help exposes the Git opt-out", async () => {
  const create = await runCapabilityTest(damatCapability, ["create", "--help"]);
  const module = await runCapabilityTest(damatCapability, [
    "module",
    "init",
    "--help",
  ]);
  expect(create.output.join("\n")).toContain("--no-git");
  expect(module.output.join("\n")).toContain("--no-git");
});

test("composed module and kit help expose repeatable targets", async () => {
  const find = (name: string, child: string) =>
    damatCommands
      .find((command) => command.name === name)
      ?.subcommands?.find((command) => command.name === child);
  expect(find("module", "add")?.options?.find((o) => o.name === "target"))
    .toMatchObject({ repeatable: true });
  expect(find("kit", "add")?.options?.find((o) => o.name === "target"))
    .toMatchObject({ repeatable: true });
  const module = await runCapabilityTest(damatCapability, [
    "module",
    "add",
    "--help",
  ]);
  const kit = await runCapabilityTest(damatCapability, [
    "kit",
    "add",
    "--help",
  ]);
  expect(module.output.join("\n")).toContain("--target");
  expect(kit.output.join("\n")).toContain("--target");
});
