[Damat Guide](../GUIDE.md) › Durable work operations

# 10.6 Inspect and recover jobs and events

Inspection clients are headless APIs. Damat does not mount unauthenticated
administration routes; your application owns authentication, authorization,
HTTP, CLI, or UI presentation.

```ts
import {
  createDurableEventInspectionClient,
  createJobInspectionClient,
} from "@damatjs/framework";

const jobs = createJobInspectionClient({
  cursorSigningKey: process.env.INSPECTION_CURSOR_KEY!,
  visibility: "metadata",
});

const events = createDurableEventInspectionClient({
  cursorSigningKey: process.env.INSPECTION_CURSOR_KEY!,
  visibility: "metadata",
});

const failedJobs = await jobs.listRuns({ views: ["failed"], limit: 25 });
const failedEvents = await events.listEvents({ views: ["failed"], limit: 25 });
```

Run detail includes attempts, activity, logs, lease and worker identity, progress,
and controls. Event detail also shows each consumer delivery.

## Apply controls deliberately

```ts
const actor = { type: "user", id: adminId };
await jobs.retry(failedJobs.items[0]!.id, actor);
await jobs.pauseQueue("reports", actor, "provider outage");
```

Store the actor and reason supplied by your authenticated admin layer. Signed
cursors protect pagination integrity; they are unrelated to authorization.

## Diagnose before retrying

1. Confirm the definition or consumer was imported before bootstrap.
2. Confirm the matching worker type and queue are selected.
3. Read the last attempt, lease transition, and activity record.
4. Fix idempotency or provider failures before applying one retry.

Unknown job definitions are dead-lettered rather than executed. Redis loss does
not lose durable work; workers fall back to PostgreSQL discovery with higher
wake-up latency.

---

Prev: [← Publish durable work](./10baa-publish-durable-work.md) · [Guide home](../GUIDE.md) · Next: [Durable pipelines →](./10c-pipelines.md)
