[Damat Guide](../GUIDE.md) › Module capabilities

# 16.2 Installation and runtime ownership

Portable capability files do not carry application policy with them. The
installer places files and records provenance; the backend owner activates and
operates them.

## Commit module data and durable work together

```ts
await inventory.transaction(async (executor) => {
  const item = await inventory.items.updateOne({
    where: { id: itemId },
    data: { status: "reconciling" },
  });

  await enqueueJob("inventory.reconcile", { itemId }, {
    executor,
    deduplication: { key: `reconcile:${itemId}` },
  });

  return item;
});
```

The domain update, durable record, and acceleration outbox commit or roll back
together. A stable deduplication or idempotency key still protects replay.

## Host responsibilities after installation

- register the module and provider roles;
- import capability definitions before bootstrap;
- configure queues, concurrency, retention, and Redis;
- select `jobs`, `events`, and/or `pipelines` workers;
- run application migrations;
- expose authenticated inspection and control tools.

A shipped link template remains dormant until the app reviews it, generates a
link-owner migration, applies that migration, and regenerates linked types.

## Module readiness

Before publishing, run codegen, type checking, tests, build, and validation.
Before running an assembled backend, run `bun run db:status` and
`bun run db:migrate` from the application.

---

Prev: [← Durable module capabilities](./16b-provider-capabilities.md) · [Guide home](../GUIDE.md) · Next: [Composing and linking modules →](./17-composing-and-linking-modules.md)
