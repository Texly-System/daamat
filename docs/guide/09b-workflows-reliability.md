[Damat Guide](../GUIDE.md) › Workflows

# 9.2 Workflow reliability and errors

Workflows provide best-effort rollback while the process is alive. Reliability
comes from choosing retryable steps, meaningful compensation, stable lock IDs,
and idempotent external effects.

## Retries and timeouts

The defaults are no retries, a 30-second step timeout, and a five-minute
workflow timeout. Configure a step when its failure mode is known:

```ts
const chargeCard = createStep(
  "charge-card",
  charge,
  refund,
  { retry: RetryPolicies.standard, timeoutMs: 10_000 },
);
```

`RetryPolicies` includes `none`, `once`, `standard`, `aggressive`, and `patient`.
Retries repeat the forward function, so a payment or API call must use the same
provider idempotency key on every attempt.

## Read failures correctly

`execute()` returns a discriminated result:

- `success: true` carries `result`, `executionId`, and `durationMs`.
- `success: false` carries `error`, `compensated`,
  `compensationsFailed`, and `compensationErrors`.

`compensated: true` means at least one compensation succeeded. It does not mean
every compensation succeeded; check `compensationErrors`.

## Prevent concurrent duplicate runs

`executeWithLock` uses a Redis-backed distributed lock:

```ts
const result = await onboardUser.executeWithLock(input, {
  lockId: `user:${input.email}`,
  ttlMs: 60_000,
  autoExtend: true,
});
```

The lock prevents concurrent runs while Redis and the runner are alive. It is
not a durable workflow journal and does not make an external effect exactly
once. If work must resume after a crash, place the workflow inside a pipeline.

---

Prev: [← Workflow implementation](./09a-workflow-implementation.md) · [Guide home](../GUIDE.md) · Next: [Redis →](./10-redis.md)
