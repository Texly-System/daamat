[Damat Guide](../GUIDE.md) › Redis

# 10. Redis

Redis has two roles in Damat: it powers Redis-native utilities and accelerates
PostgreSQL-backed durable workers. Do not confuse those roles.

Redis improves durable-work wake-up latency, worker liveness, and invalidation.
It does not own:

- module/job/event/pipeline durability records
- job history and delivery state
- migration state and inspection traces

If Redis is unavailable, durable jobs, events, and pipelines keep progressing
through PostgreSQL fallback with higher wake-up latency. Cache, pub/sub, locks,
sessions, rate limits, counters, and `RedisQueue` still require Redis.

## Read next

- [Cache and rate limits →](./10aa-redis-cache-and-rate-limits.md)
- [Locks, queues, sessions, and counters →](./10ab-redis-locks-and-queues.md)

---

Prev: [← Workflow reliability](./09b-workflows-reliability.md) · [Guide home](../GUIDE.md) · Next: [Cache, sessions, and rate limits →](./10aa-redis-cache-and-rate-limits.md)
