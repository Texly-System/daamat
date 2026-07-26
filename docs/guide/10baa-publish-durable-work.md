[Damat Guide](../GUIDE.md) › Jobs and durable events

# 10.5 Publish durable work atomically

Without an executor, `enqueueJob` and `publishDurableEvent` each create their own
transaction. That is fully durable, but it is not atomic with a separate domain
write.

Pass the executor from `ModuleService.transaction` when the domain row and
durable work represent one business action:

```ts
import { enqueueJob, publishDurableEvent } from "@damatjs/framework";

await users.transaction(async (executor) => {
  const user = await users.users.create({
    data: { email: "a@b.co" },
    returning: ["id", "email"],
  });

  await enqueueJob(
    "send-welcome-email",
    { userId: user.id },
    {
      executor,
      deduplication: { key: `welcome:${user.id}` },
    },
  );

  await publishDurableEvent(
    "user.created",
    { userId: user.id, email: user.email },
    {
      executor,
      correlationId: user.id,
      idempotencyKey: `user.created:${user.id}`,
    },
  );
});
```

The domain insert, job run, event record, and acceleration-outbox entries commit
together. A rollback leaves none of them behind and emits no Redis wake-up.

Job deduplication and durable-event idempotency solve replay, not handler-side
exactly-once effects. Use `context.withIdempotency` for database effects and pass
the same stable key to external providers when supported.

Each key is bound to a canonical fingerprint of its complete durable intent.
The same key and intent replay the retained result; a changed payload, tenant,
policy, scheduling mode, or other intent field throws
`IdempotencyConflictError`. Rows created before fingerprints were recorded also
raise this typed conflict because their original intent cannot be verified.

---

Prev: [← Define jobs and durable events](./10ba-jobs-and-workers-runtime.md) · [Guide home](../GUIDE.md) · Next: [Inspect and recover durable work →](./10bb-events-jobs-observability.md)
