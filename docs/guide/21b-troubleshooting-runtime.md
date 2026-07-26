[Damat Guide](../GUIDE.md) › Troubleshooting runtime

# 21.1 Runtime and durability faults

## Durable events do not route or deliver

Check that:

- a process selects `events`;
- the event definition and stable named consumers load before bootstrap;
- event and durability migrations are current;
- the event router is running;
- a worker is configured for the event/consumer pair.

Routing and consumer delivery are separate persisted stages. Inspect the event
record before assuming the consumer handler is at fault.

## A pipeline does not advance

Check that:

- a process selects `pipelines`;
- the pipeline definition and version are registered;
- every referenced workflow, job, and event capability is registered;
- pipeline migrations are current;
- direct job nodes have a matching job worker;
- durable event consumers have event workers when delivery is expected.

Read the run's node executions, transitions, signals, activity, and backing-job
attempts to find the first stage that stopped.

## Work executes again after a crash

Durable execution is at least once. A worker can lose its lease after performing
an external effect but before recording success. Use
`context.withIdempotency` for database effects and the same stable key with
external providers when supported.

Diagnose ownership from leases, attempts, transitions, and activity history,
not worker liveness alone.

## Redis is unavailable or unauthorized

Jobs, durable events, and pipelines continue through PostgreSQL fallback. Cache,
locks, sessions, rate limits, Redis queues, and ephemeral broadcast do not gain a
PostgreSQL replacement.

For `NOPERM`, preserve command and key rules and add channel patterns:

```text
&damat:*
&damat-events
```

Verify both publish and subscribe permissions. The runtime remains degraded
until its capability probe recovers.

## Database connection activity looks duplicated

One process creates one pool, but a pool intentionally owns several physical
connections up to its limit. Investigate additional pool construction inside
routes, services, handlers, or workers; do not treat ordinary checkout reuse as
a duplicate pool.

## Inspection cursor or control fails

Use a stable, non-empty cursor signing key. Rotating it invalidates existing
cursors. Administrative adapters must supply authenticated actors and required
reason or idempotency fields. Damat mounts no public admin routes.

---

Prev: [← Troubleshooting](./21-troubleshooting.md) · [Guide home](../GUIDE.md) · Next: [Tooling and build faults →](./21c-troubleshooting-tooling.md)
