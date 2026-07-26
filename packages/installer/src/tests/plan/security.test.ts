import { expect, test } from "bun:test";
import { createInstallPlan } from "../../index";
import { fixture, lock } from "./fixture";

test("createInstallPlan enforces security policy", () => {
  const artifact = fixture();
  artifact.metadata.verification = "rejected";
  const input = {
    projectDir: "/project",
    artifact,
    recipe: { schemaVersion: 1 as const, id: "blade", kind: "module" },
    lock,
  };
  expect(() => createInstallPlan(input)).toThrow("rejected");
  artifact.metadata.verification = "unverified";
  expect(() =>
    createInstallPlan({ ...input, securityPolicy: "require" }),
  ).toThrow("unverified");
});
