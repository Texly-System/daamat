[Damat Guide](../GUIDE.md) › Module capabilities

# 16.1 Jobs, events, and pipelines in a module

A module can ship durable definitions, but the assembled backend decides whether
and where they execute.

## Job and event definitions

```ts
import { defineDurableEvent, defineDurableEventHandler } from "@damatjs/events";
import { defineJob } from "@damatjs/jobs";

defineJob("inventory.reconcile", async (input, context) => {
  await reconcileWarehouse(input.warehouseId, {
    idempotencyKey: `inventory:${input.warehouseId}`,
    signal: context.signal,
  });
  return { reconciled: true };
});

defineDurableEvent("inventory.low", { version: 1 });
defineDurableEventHandler("inventory.low", "notify-buyer", async (event) => {
  await notifyBuyer(event.sku);
  return { notified: true };
});
```

Job names, event names, and consumer names become persisted identities. Keep
them stable and make handlers safe for at-least-once execution.

## Pipeline definitions

```ts
import { definePipeline } from "@damatjs/pipelines";

definePipeline("inventory.restock", {
  version: 1,
  start: "reserve",
  nodes: [
    { id: "reserve", kind: "job", name: "inventory.reserve" },
  ],
  edges: [],
  output: { reservation: { $ref: "nodes.reserve.output" } },
});
```

Pipelines may also use registered workflow, event, signal, delay, branch, join,
loop, foreach, and child-pipeline nodes. The host must import all referenced
definitions, enable matching services, select workers, and apply migrations.

---

Prev: [← Read module capabilities](./16-module-capabilities.md) · [Guide home](../GUIDE.md) · Next: [Installation and runtime ownership →](./16c-capabilities-installation-and-runtime.md)
