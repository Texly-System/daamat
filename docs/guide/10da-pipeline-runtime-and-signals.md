[Damat Guide](../GUIDE.md) › Pipeline runtime

# 10.9 Start and signal a pipeline run

Start a published pipeline by name. Use a stable idempotency key when the same
request may be replayed.

```ts
import { signalPipelineRun, startPipeline } from "@damatjs/framework";

const run = await startPipeline("account.onboarding", input, {
  idempotencyKey: `account:${input.accountId}`,
  correlationId: input.accountId,
  actor: { id: currentUser.id, type: "user" },
});

await signalPipelineRun(
  run.id,
  "approved",
  { approved: true },
  {
    actor: { id: currentUser.id, type: "user" },
    reason: "Compliance review completed",
    idempotencyKey: requestId,
  },
);
```

A signal name must match a `signal.wait` node in the pinned manifest. Signals
may arrive before that node becomes active; PostgreSQL buffers and consumes them
once when the wait is reached. Signal calls require actor, reason, and
idempotency metadata.

Durable event waits use a different boundary. The wait scans matching event
history from its node-execution activation, so an event published earlier is
excluded even when its correlation ID matches. Correlation narrows eligible
events; it does not make earlier facts visible. Use a forked, correlated
`event.wait` branch beside the work/publish branch and an `all` join when a
process must start work and await its completion event.

## Start work in a domain transaction

Starts and signals accept the executor from `ModuleService.transaction`:

```ts
await accounts.transaction(async (executor) => {
  await accounts.account.update({
    where: { id: input.accountId },
    data: { onboardingStarted: true },
  });
  await startPipeline("account.onboarding", input, {
    executor,
    idempotencyKey: `account:${input.accountId}`,
  });
});
```

The domain write, pipeline run, first node state, and acceleration outbox then
commit together. A rollback leaves no run and sends no wake-up.

---

Prev: [← Define a pipeline](./10d-pipeline-definition.md) · [Guide home](../GUIDE.md) · Next: [Operate pipelines →](./10e-pipeline-operations.md)
