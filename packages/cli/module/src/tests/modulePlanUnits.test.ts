import { describe, expect, mock, test } from "bun:test";
import { buildModuleInstallPlan } from "../commands/module/shared/plan";
import { createContext } from "./helpers";
import { artifact, lock, manifest, plan, request } from "./fixtures/installer";

describe("module plan construction", () => {
  test("builds source add plans with provider backend support", async () => {
    const { ctx } = createContext({ yes: true });
    const expected = plan();
    const install = mock(() => expected);
    const resolved = {
      artifact: artifact(),
      provider: manifest(),
      recipe: { schemaVersion: 1, id: "billing", kind: "module" },
      options: { mode: "source" as const, packageBackend: "damat" as const },
    };
    const result = await buildModuleInstallPlan(ctx, "/source", "add", {
      resolve: mock(async () => resolved),
      install,
      update: mock(async () => expected),
      readLock: mock(() => lock()),
    });
    expect(result.plan).toBe(expected);
    expect(install.mock.calls[0]?.[0]).toMatchObject({
      mode: "source",
      packageBackend: "damat",
      confirmModified: true,
      supportedPackageBackends: ["node", "damat"],
    });
  });

  test("builds update plans with defaults", async () => {
    const { ctx } = createContext({ "experimental-package": true });
    const expected = plan("update");
    const update = mock(async () => expected);
    await buildModuleInstallPlan(ctx, request, "update", {
      resolve: mock(async () => ({
        artifact: artifact(),
        provider: { ...manifest(), install: undefined },
        recipe: { schemaVersion: 1, id: "billing", kind: "module" },
        options: {},
      })),
      install: mock(() => expected),
      update,
      readLock: mock(() => lock()),
    });
    expect(update.mock.calls[0]?.[0]).toMatchObject({
      experimentalPackage: true,
    });
  });

  test("passes every target override through the resolved recipe", async () => {
    const { ctx } = createContext({});
    const expected = plan();
    const install = mock(() => expected);
    const recipe = {
      schemaVersion: 1,
      id: "billing",
      kind: "module" as const,
      targets: { routes: "src/http", jobs: "src/workers" },
    };
    await buildModuleInstallPlan(ctx, "/source", "add", {
      resolve: mock(async () => ({
        artifact: artifact(),
        provider: manifest(),
        recipe,
        options: { targets: recipe.targets },
      })),
      install,
      update: mock(async () => expected),
      readLock: mock(() => lock()),
    });
    expect(install.mock.calls[0]?.[0].recipe).toBe(recipe);
  });
});
