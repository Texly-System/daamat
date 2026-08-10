import { describe, expect, it } from "bun:test";
import { Effect, Exit, TestClock, TestContext } from "@damatjs/deps/effect";
import { createStep, executeStep } from "../src/step";
import { ctx } from "./config-retry.fixture";

describe("config/retry: zero-delay timing", () => {
  it("uses no virtual time when initialDelayMs is zero", async () => {
    let attempts = 0;
    const step = createStep<number, string>(
      "zero-delay",
      async () => {
        attempts++;
        if (attempts < 3) throw new Error("transient");
        return "ok";
      },
      undefined,
      { retry: { maxAttempts: 3, initialDelayMs: 0 } },
    );
    const result = Effect.gen(function* () {
      const start = yield* TestClock.currentTimeMillis;
      const exit = yield* Effect.exit(
        Effect.scoped(executeStep(step, 1, ctx())),
      );
      const end = yield* TestClock.currentTimeMillis;
      return { elapsed: end - start, exit };
    }).pipe(Effect.provide(TestContext.TestContext));
    const { elapsed, exit } = await Effect.runPromise(result);
    expect(Exit.isSuccess(exit)).toBe(true);
    expect(attempts).toBe(3);
    expect(elapsed).toBe(0);
  });
});
