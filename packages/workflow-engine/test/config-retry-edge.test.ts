import { describe, expect, it } from "bun:test";
import { Exit } from "@damatjs/deps/effect";
import { DEFAULT_RETRY_POLICY, RetryPolicies } from "../src/config";
import { createStep, executeStep } from "../src/step";
import type { RetryPolicy, WorkflowEngineState } from "../src/types";
import { ctx, runScoped } from "./config-retry.fixture";

describe("config/retry: policy layering precedence", () => {
  it("a preset merged over DEFAULT supplies the missing fields", async () => {
    let attempts = 0;
    const merged: RetryPolicy = {
      ...DEFAULT_RETRY_POLICY,
      ...RetryPolicies.once,
    };
    const step = createStep<number, string>(
      "once-preset",
      async () => {
        attempts++;
        throw new Error("fail");
      },
      undefined,
      { retry: merged },
    );
    await runScoped(executeStep(step, 1, ctx()));
    expect(attempts).toBe(2);
  });

  it("workflow defaults apply when the step omits retry", async () => {
    let attempts = 0;
    const step = createStep<number, string>("no-own-retry", async () => {
      attempts++;
      if (attempts < 2) throw new Error("transient");
      return "ok";
    });
    const engineState: WorkflowEngineState = {
      compensationsRun: 0,
      compensationsFailed: 0,
      defaultStepConfig: { retry: { maxAttempts: 3, initialDelayMs: 1 } },
    };
    const exit = await runScoped(executeStep(step, 1, ctx(engineState)));
    expect(Exit.isSuccess(exit)).toBe(true);
    expect(attempts).toBe(2);
  });

  it("the step retry policy overrides the workflow default", async () => {
    let attempts = 0;
    const step = createStep<number, string>(
      "own-wins",
      async () => {
        attempts++;
        throw new Error("fail");
      },
      undefined,
      { retry: { maxAttempts: 0 } },
    );
    const engineState: WorkflowEngineState = {
      compensationsRun: 0,
      compensationsFailed: 0,
      defaultStepConfig: { retry: { maxAttempts: 5, initialDelayMs: 1 } },
    };
    await runScoped(executeStep(step, 1, ctx(engineState)));
    expect(attempts).toBe(1);
  });

  it("a per-call override is the highest-priority retry layer", async () => {
    let attempts = 0;
    const step = createStep<number, string>(
      "override-top",
      async () => {
        attempts++;
        if (attempts < 4) throw new Error("transient");
        return "ok";
      },
      undefined,
      { retry: { maxAttempts: 1, initialDelayMs: 1 } },
    );
    const engineState: WorkflowEngineState = {
      compensationsRun: 0,
      compensationsFailed: 0,
      defaultStepConfig: { retry: { maxAttempts: 0 } },
    };
    const exit = await runScoped(
      executeStep(step, 1, ctx(engineState), { retry: { maxAttempts: 4 } }),
    );
    expect(Exit.isSuccess(exit)).toBe(true);
    expect(attempts).toBe(4);
  });

  it("presets expose the documented attempt counts", () => {
    expect(RetryPolicies.none.maxAttempts).toBe(0);
    expect(RetryPolicies.once.maxAttempts).toBe(1);
    expect(RetryPolicies.standard.maxAttempts).toBe(3);
    expect(RetryPolicies.aggressive.maxAttempts).toBe(5);
    expect(RetryPolicies.patient.maxAttempts).toBe(3);
  });
});
