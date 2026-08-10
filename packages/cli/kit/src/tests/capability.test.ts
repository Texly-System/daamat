import { expect, test } from "bun:test";
import { runCapabilityTest } from "@damatjs/cli/testing";
import { kitCliCapability } from "../capability";

test("kit capability runs standalone", async () => {
  expect(kitCliCapability.commands.map((command) => command.name)).toEqual([
    "kit",
  ]);
  const run = await runCapabilityTest(kitCliCapability, ["--help"]);
  expect(run.output.join("\n")).toContain("kit");
});

test("kit install commands mark target as repeatable", () => {
  const kit = kitCliCapability.commands[0];
  const targets = kit?.subcommands
    ?.filter((command) => ["add", "plan", "update"].includes(command.name))
    .map((command) => command.options?.find((option) => option.name === "target"));
  expect(targets?.every((option) => option?.repeatable === true)).toBe(true);
});
