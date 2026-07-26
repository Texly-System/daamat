import { describe, expect, test } from "bun:test";
import { Effect, createStep, createWorkflow, executeStep } from "../src";

describe("workflow execution", () => {
  test("runs steps in order and returns the result", async () => {
    const calls: string[] = [];
    const stepA = createStep("a", async (input: { n: number }) => {
      calls.push("a");
      return { n: input.n + 1 };
    });
    const stepB = createStep("b", async (input: { n: number }) => {
      calls.push("b");
      return { n: input.n * 2 };
    });
    const workflow = createWorkflow("order", (input: { n: number }, context) =>
      Effect.gen(function* () {
        const a = yield* executeStep(stepA, input, context);
        return yield* executeStep(stepB, a, context);
      }),
    );

    const result = await workflow.execute({ n: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.result.n).toBe(4);
    expect(calls).toEqual(["a", "b"]);
    expect(result.executionId).toBeTruthy();
  });

  test("failure surfaces the workflow error with code", async () => {
    const boom = createStep("boom", async () => {
      throw new Error("kaput");
    });
    const workflow = createWorkflow("failing", (input: {}, context) =>
      Effect.gen(function* () {
        return yield* executeStep(boom, input, context);
      }),
    );

    const result = await workflow.execute({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("kaput");
      expect(result.compensated).toBe(false);
      expect(result.compensationsFailed).toBe(0);
    }
  });

  test("hostile input serialization cannot prevent execution", async () => {
    const cyclic: Record<string, unknown> = { value: 1n };
    cyclic.self = cyclic;
    cyclic.toJSON = () => {
      throw new Error("must not serialize");
    };
    const input = new Proxy(cyclic, {
      ownKeys() {
        throw new Error("must not inspect");
      },
    });
    const workflow = createWorkflow("hostile", () => Effect.succeed("ok"));
    const result = await workflow.execute(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.result).toBe("ok");
  });
});
