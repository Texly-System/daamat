import { describe, expect, mock, test } from "bun:test";
import { executeModulePlan } from "../commands/module/shared/execute";
import { reportModulePlan } from "../commands/module/shared/report";
import { createContext } from "./helpers";
import { manifest, plan } from "./fixtures/installer";

describe("module plan reporting and execution", () => {
  test("reports add warnings, package backend, and custom instructions", () => {
    const { ctx, logger } = createContext({});
    const provider = manifest();
    provider.install!.instructions = { add: ["wire billing"] };
    reportModulePlan(ctx, plan(), provider);
    expect(logger.warn).toHaveBeenCalledWith("check usage");
    expect(logger.info).toHaveBeenCalledWith("wire billing");
    expect(logger.info).toHaveBeenCalledWith("capability module", {
      providerSource: "src/**",
      destination: "src/modules/billing",
      destinationSource: "fallback",
      operations: 3,
    });
  });

  test("reports default removal instructions", () => {
    const { ctx, logger } = createContext({});
    reportModulePlan(ctx, plan("remove"));
    expect(logger.info.mock.calls.flat().join(" ")).toContain("billing");
  });

  test("executes plans with the shared runtime", async () => {
    const { ctx } = createContext({});
    const execute = mock(async () => {});
    const runtime = { now: () => "now" };
    await executeModulePlan(ctx, plan(), manifest(), {
      execute: execute as never,
      runtime: mock(() => runtime as never),
    });
    expect(execute).toHaveBeenCalledWith(expect.anything(), runtime);
  });
});
