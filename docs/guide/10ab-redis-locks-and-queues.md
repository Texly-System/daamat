[Damat Guide](../GUIDE.md) › Redis locks, queues, sessions

# 10.2 Redis locks, queues, and sessions

These helpers intentionally store coordination state in Redis. Use them only
when Redis availability matches the feature's correctness requirements.

## Distributed locks

```ts
import { withLock } from "@damatjs/redis";

await withLock("import-job", async () => {
  /* only one worker enters this critical section */
}, 30_000);
```

`releaseLock` only succeeds when the token matches the owning holder.

## RedisQueue

`RedisQueue` stores queue state in Redis, not PostgreSQL. It is useful when that
tradeoff is intentional, but it is not Damat's durable job system. Visibility
timeout recovery is opt-in, and enqueueing the same ID does not enforce
deduplication.

```ts
import { RedisQueue, type QueueJob } from "@damatjs/redis";

const queue = new RedisQueue<{ to: string }>("emails");
const job: QueueJob<{ to: string }> = {
  id: crypto.randomUUID(),
  queue: "emails",
  data: { to: "a@b.co" },
  status: "pending",
  createdAt: new Date(),
  attempts: 0,
  maxAttempts: 3,
};
await queue.enqueue(job);
```

For durable processing with restart safety and inspection, use
[`@damatjs/jobs`](./10b-events-and-jobs.md) and the worker
runtime pages.

## Session and counter helpers

- `SessionManager<T>` handles `get`, `set`, `touch`, `refresh`, and `delete`.
- counters provide `incrementCounter`, `getCounter`, decrement/reset/set patterns.

See package internals for complete option lists:
[`../../packages/core/redis/docs/README.md`](../../packages/core/redis/docs/README.md)

---

Prev: [← Cache and rate limits](./10aa-redis-cache-and-rate-limits.md) · [Guide home](../GUIDE.md) · Next: [Events & background jobs →](./10b-events-and-jobs.md)
