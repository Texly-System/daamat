import { describe, expect, test } from "bun:test";
import { createInstallPlan } from "../../index";
import { fixture, lock } from "./fixture";

describe("createInstallPlan", () => {
  test("creates a checksum-bearing source plan", () => {
    const plan = createInstallPlan({
      projectDir: "/project",
      artifact: fixture(),
      recipe: {
        schemaVersion: 1,
        id: "blade",
        kind: "module",
        capabilityMappings: [
          {
            capability: "source",
            from: "index.ts",
            to: "index.ts",
            source: "receiver",
          },
          {
            capability: "absent",
            from: "missing/**",
            to: "missing",
            source: "fallback",
          },
        ],
      },
      mode: "source",
      lock,
    });
    expect(plan.mode).toBe("source");
    expect(plan.operations).toEqual([
      {
        type: "write-file",
        source: expect.any(String),
        target: "index.ts",
        checksum: expect.any(String),
      },
    ]);
    expect(plan.capabilityMappings).toEqual([
      expect.objectContaining({ capability: "absent", operationCount: 0 }),
      expect.objectContaining({ capability: "source", operationCount: 1 }),
    ]);
  });

  test("creates immutable package operations with declared dependencies", () => {
    const plan = createInstallPlan({
      projectDir: "/project",
      artifact: fixture(),
      recipe: {
        schemaVersion: 1,
        id: "blade",
        kind: "module",
        packages: { zod: "^4", alpha: "1" },
      },
      mode: "package",
      experimentalPackage: true,
      lock,
    });
    expect(plan.operations).toEqual([
      { type: "add-package", name: "@example/blade", reference: "1.0.0" },
      { type: "add-package", name: "alpha", reference: "1" },
      { type: "add-package", name: "zod", reference: "^4" },
    ]);
    expect(JSON.parse(JSON.stringify(plan))).toEqual(plan);
  });
});
