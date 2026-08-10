import { beforeEach, expect, test } from "bun:test";
import { defineDurableEvent, publishDurableEvent } from "@damatjs/events";
import {
  clearPipelineRuntime,
  definePipeline,
  findPipelineRun,
  listPipelineNodeExecutions,
  registerPipelineEvent,
  startPipeline,
  syncPipelineDefinitions,
} from "../../src";
import { ensureStorage, uniqueName } from "./context";
import { routeToTerminal, routeUntil } from "./pipeline-fixture";

beforeEach(async () => {
  await ensureStorage();
  clearPipelineRuntime();
});

test("event waits exclude matching events published before activation", async () => {
  const event = uniqueName("early-event");
  defineDurableEvent(event);
  registerPipelineEvent({ name: event });
  const definition = definePipeline(uniqueName("event-boundary"), {
    version: 1,
    start: "wait",
    nodes: [{ id: "wait", kind: "event.wait", event, correlation: "request" }],
    edges: [],
  });
  await syncPipelineDefinitions();
  await publishDurableEvent(event, { accepted: true }, { correlationId: "request" });
  const run = await startPipeline(definition.name, {});
  const waiting = await routeUntil(
    () => findPipelineRun(run.id),
    (value) => value?.status === "waiting",
    "the event wait to remain waiting",
    4,
  );
  expect(waiting?.completedAt).toBeUndefined();
  expect((await listPipelineNodeExecutions(run.id))[0]?.status).toBe("waiting");
});

test("a pre-armed event wait joins the later completion event", async () => {
  const event = uniqueName("completion-event");
  defineDurableEvent(event);
  registerPipelineEvent({ name: event });
  const definition = definePipeline(uniqueName("pre-armed"), {
    version: 1,
    start: "fork",
    nodes: [
      { id: "fork", kind: "fork" },
      { id: "wait", kind: "event.wait", event, correlation: "request" },
      { id: "publish", kind: "event.publish", event, correlation: "request" },
      { id: "join", kind: "join", join: "all" },
    ],
    edges: [
      { from: "fork", to: "wait" },
      { from: "fork", to: "publish" },
      { from: "wait", to: "join" },
      { from: "publish", to: "join" },
    ],
  });
  await syncPipelineDefinitions();
  const run = await startPipeline(definition.name, {});
  const branches = await routeUntil(
    () => listPipelineNodeExecutions(run.id),
    (value) =>
      value.filter((node) => ["wait", "publish"].includes(node.nodeId))
        .length === 2,
    "the pre-armed wait and work branches",
  );
  expect(branches.filter((node) => ["wait", "publish"].includes(node.nodeId))).toHaveLength(2);
  expect((await routeToTerminal(run.id)).status).toBe("succeeded");
  const nodes = await listPipelineNodeExecutions(run.id);
  expect(nodes.find((node) => node.nodeId === "wait")?.status).toBe("succeeded");
  expect(nodes.find((node) => node.nodeId === "join")?.status).toBe("succeeded");
});
