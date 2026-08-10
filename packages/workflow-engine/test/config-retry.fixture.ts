import { Effect, Scope } from "@damatjs/deps/effect";
import type { WorkflowContext, WorkflowEngineState } from "../src/types";

export const ctx = (engineState?: WorkflowEngineState): WorkflowContext => ({
  executionId: "exec-cfg",
  workflowName: "cfg-wf",
  startedAt: new Date(),
  attempt: 1,
  metadata: {},
  engineState,
});

export function runScoped<O, E>(effect: Effect.Effect<O, E, Scope.Scope>) {
  return Effect.runPromiseExit(Effect.scoped(effect));
}
