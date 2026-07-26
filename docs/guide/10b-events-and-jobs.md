[Damat Guide](../GUIDE.md) › Events & background jobs

# 10.3 Events and background jobs

Damat has three related but different asynchronous primitives.

| Need | Use | Persisted? |
| ---- | --- | ---------- |
| Notify listeners in this process | local event bus | no |
| Deliver one fact independently to named consumers | durable event | yes |
| Run one deferred, retryable unit | job | yes |

Use a pipeline when several durable stages must wait, branch, or resume as one
visible process.

## Local event bus

```ts
import { getEventBus } from "@damatjs/framework";

declare module "@damatjs/events" {
  interface EventMap {
    "user.created": { id: string; email: string };
  }
}

const bus = getEventBus();
const unsubscribe = bus.on("user.created", async (user, context) => {
  logger.info("user observed", { id: user.id, source: context.source });
});

await bus.emit("user.created", { id: "u1", email: "a@b.co" });
unsubscribe();
```

Local listeners are error-isolated and need no Redis. Cross-process broadcast is
optional Redis pub/sub and remains ephemeral: it is not durable delivery.

## Durable events

A durable event persists one event record, then creates a separate delivery for
each stable named consumer present when the event is routed. Every delivery has
its own attempts, lease, retry or dead-letter state, logs, and controls.

Choose this when the payload is a fact such as `user.created` and several
consumers may react independently.

## Jobs

A job is one named unit such as generating a report, sending an email, or
synchronizing a search index. A run records queue state, attempts, progress,
logs, result, cancellation, and recovery.

Jobs and durable event deliveries are at least once. Handlers must tolerate
re-execution after a crash or expired lease.

---

Prev: [← Redis utilities](./10ab-redis-locks-and-queues.md) · [Guide home](../GUIDE.md) · Next: [Define jobs and durable events →](./10ba-jobs-and-workers-runtime.md)
