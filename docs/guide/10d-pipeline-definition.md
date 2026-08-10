[Damat Guide](../GUIDE.md) › Pipeline definition

# 10.8 Define a pipeline

Register every capability a graph may reference, then define the graph. Stable
registrations give runtime validation and visual authoring a safe capability
catalog.

```ts
import {
  definePipeline,
  registerPipelineEvent,
  registerPipelineJob,
  registerPipelineWorkflow,
} from "@damatjs/framework";
import { provisionTenant } from "../workflows/provision-tenant";

registerPipelineWorkflow(provisionTenant, {
  inputSchema: { type: "object", required: ["tenantId"] },
});
registerPipelineJob({ name: "billing.invoice" });
registerPipelineEvent({ name: "tenant.ready" });

export const tenantSetup = definePipeline("tenant.setup", {
  version: 1,
  start: "provision",
  inputSchema: { type: "object", required: ["tenantId", "plan"] },
  nodes: [
    {
      id: "provision",
      kind: "workflow",
      name: provisionTenant.name,
      input: { tenantId: { $ref: "input.tenantId" } },
    },
    {
      id: "paid",
      kind: "condition",
      expression: { op: "eq", left: { $ref: "input.plan" }, right: "paid" },
    },
    { id: "invoice", kind: "job", name: "billing.invoice" },
    { id: "announce", kind: "event.publish", event: "tenant.ready" },
  ],
  edges: [
    { from: "provision", to: "paid" },
    {
      from: "paid",
      to: "invoice",
      when: { op: "eq", left: { $ref: "nodes.paid.output" }, right: true },
    },
    {
      from: "paid",
      to: "announce",
      when: { op: "eq", left: { $ref: "nodes.paid.output" }, right: false },
    },
    { from: "invoice", to: "announce" },
  ],
  output: {
    tenantId: { $ref: "input.tenantId" },
    announcement: { $ref: "nodes.announce.output" },
  },
});
```

`$ref` reads pipeline input or a completed node's output. Declare `output`
explicitly for branched or forked graphs so the result does not depend on which
node happens to finish last.

Code definitions have stable version labels and checksums. Reusing a version
label with a changed graph fails startup instead of rewriting running or
historical instances.

## Pre-arm an event completion wait

An `event.wait` starts its durable-event history at the creation of its node
execution. Correlation filters that history but does not move the boundary
backward, so a matching event published before the wait execution exists is
not consumed. For start-work/await-completion flows, fork the wait and work
branches before publishing the completion event, then require both branches at
an `all` join:

```text
fork ──> event.wait(completion, correlation) ──┐
  └──> work ──> event.publish(completion) ─────┴──> join(all)
```

This makes the event wait durable and correlated without relying on an earlier
fact. If an earlier-history boundary is needed, that must be an additive API;
the current graph contract does not provide one.

---

Prev: [← Durable pipelines](./10c-pipelines.md) · [Guide home](../GUIDE.md) · Next: [Start and signal a run →](./10da-pipeline-runtime-and-signals.md)
