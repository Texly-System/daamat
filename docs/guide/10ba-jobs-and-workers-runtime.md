[Damat Guide](../GUIDE.md) › Jobs and durable events

# 10.4 Define jobs and durable events

Definitions must load before framework bootstrap so workers know which names
and consumers they may execute.

```ts
import {
  defineDurableEvent,
  defineDurableEventHandler,
  defineJob,
} from "@damatjs/framework";

defineJob("send-welcome-email", async ({ userId }, context) => {
  await mailer.sendWelcome(userId, {
    idempotencyKey: `welcome:${userId}`,
    signal: context.signal,
  });
  return { sent: true };
});

defineDurableEvent("user.created", {
  version: 1,
  maxAttempts: 5,
});

defineDurableEventHandler("user.created", "audit-user", async (user) => {
  await auditUser(user.id);
  return { audited: true };
});
```

Use stable names. A durable event consumer name is part of its persisted
delivery identity, so renaming it creates a different consumer.

## Enable services and workers

```ts
services: {
  jobs: { queue: "default", concurrency: 4 },
  events: { durable: { concurrency: 4 } },
},
runtime: {
  mode: "all",
  workers: ["jobs", "events"],
},
```

Run `bun run db:migrate` after enabling either service. A `server` process does
not run workers. A `worker` process is headless and must select at least one
enabled worker type.

---

Prev: [← Events and background jobs](./10b-events-and-jobs.md) · [Guide home](../GUIDE.md) · Next: [Publish durable work →](./10baa-publish-durable-work.md)
