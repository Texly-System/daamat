import { describe, expect, it } from "bun:test";
import {
  Effect,
  Fiber,
  Scope,
  TestClock,
  TestContext,
} from "@damatjs/deps/effect";
import { createStep, executeStep } from "../src/step";
import { ctx } from "./config-retry.fixture";

function observeAttempts(
  effect: Effect.Effect<unknown, unknown, Scope.Scope>,
  advances: number[],
  readAttempts: () => number,
) {
  const program = Effect.gen(function* () {
    const fiber = yield* Effect.fork(effect);
    yield* Effect.promise(() => Bun.sleep(0));
    const observed = [readAttempts()];
    for (const duration of advances) {
      yield* TestClock.adjust(duration);
      yield* Effect.promise(() => Bun.sleep(0));
      observed.push(readAttempts());
    }
    yield* Fiber.await(fiber);
    return observed;
  });
  return Effect.runPromise(
    program.pipe(Effect.scoped, Effect.provide(TestContext.TestContext)),
  );
}

describe("config/retry: exponential backoff timing", () => {
  it("uses 30ms, 60ms, and 120ms delays", async () => {
    let attempts = 0;
    const step = createStep<number, string>(
      "backoff",
      async () => {
        attempts++;
        throw new Error("retry");
      },
      undefined,
      {
        retry: {
          maxAttempts: 3,
          initialDelayMs: 30,
          backoffMultiplier: 2,
          maxDelayMs: 500,
        },
      },
    );
    const observed = await observeAttempts(
      executeStep(step, 1, ctx()),
      [29, 1, 59, 1, 119, 1],
      () => attempts,
    );
    expect(observed).toEqual([1, 1, 2, 2, 3, 3, 4]);
  });

  it("caps each delay at maxDelayMs", async () => {
    let attempts = 0;
    const step = createStep<number, string>(
      "capped-backoff",
      async () => {
        attempts++;
        throw new Error("again");
      },
      undefined,
      {
        retry: {
          maxAttempts: 3,
          initialDelayMs: 1,
          backoffMultiplier: 1000,
          maxDelayMs: 20,
        },
      },
    );
    const observed = await observeAttempts(
      executeStep(step, 1, ctx()),
      [1, 19, 1, 19, 1],
      () => attempts,
    );
    expect(observed).toEqual([1, 2, 2, 3, 3, 4]);
  });
});
