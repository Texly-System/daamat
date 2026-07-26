[Damat Guide](../GUIDE.md) › Redis cache and rate limits

# 10.1 Redis cache and rate limits

Use cache for data that can be recomputed and rate limits for shared request
budgets. Neither is a durable record of business state.

## Cache

```ts
import { cacheGet, cacheSet, cacheSetTagged, invalidateCacheTags } from "@damatjs/redis";

await cacheSet("user:1", user, 60);
const cached = await cacheGet<User>("user:1");

await cacheSetTagged("user:42:plan", userPlan, 300, ["plans", "user:42"]);
await invalidateCacheTags(["plans"]);
```

`cacheSetTagged` and `invalidateCacheTags` support grouped invalidation. Cached
JSON values lose non-JSON types such as `Date`, `Map`, and `BigInt`; use raw
helpers with your own encoding when those types matter.

## Rate limiting

```ts
import { checkRateLimit } from "@damatjs/redis";

const decision = await checkRateLimit("ip:203.0.113.5", 60_000, 100);
if (!decision.allowed) {
  // remaining, resetAt, retryAfter
}
```

HTTP route throttling can also be configured with
`projectConfig.http.rateLimit`. Decide whether the HTTP layer should fail open
or return `503` when Redis is unavailable.

Next page covers critical sections, pub/sub-driven queue usage, and durable
session/counter helpers.

---

Prev: [← Redis](./10-redis.md) · [Guide home](../GUIDE.md) · Next: [Locks, queues, and sessions →](./10ab-redis-locks-and-queues.md)
