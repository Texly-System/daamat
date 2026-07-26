[Damat Guide](../GUIDE.md) › Composition and durability runtime

# 2.3 Composition and durability runtime

## PostgreSQL owns durable truth

PostgreSQL stores domain rows and the durable execution record:

- job runs and attempts;
- durable events and each consumer delivery;
- pipeline definitions, versions, runs, nodes, transitions, and signals;
- leases, controls, logs, results, retention, and audit history.

Every application process creates one shared PostgreSQL pool. HTTP, modules,
workers, inspection, and maintenance all use that pool.

## Redis accelerates selected features

Redis provides rebuildable coordination:

- durable-work wake-ups and worker liveness;
- ephemeral pub/sub and inspection invalidations;
- cache, sessions, locks, counters, queues, and rate limiting.

When Redis is unavailable, durable jobs, events, and pipelines continue through
bounded PostgreSQL discovery. Redis-only features such as cache, locks, sessions,
rate limits, and cross-process ephemeral broadcast still require Redis.

## Runtime modes

| Mode | HTTP | Workers |
| ---- | ---- | ------- |
| `server` | yes | no |
| `worker` | no | selected enabled workers |
| `all` | yes | selected enabled workers |

Env override:

```bash
DAMAT_RUNTIME_MODE=worker DAMAT_WORKER_TYPES=jobs,pipelines bun run start
```

## Schema and runtime lifecycle

```text
model change -> generate migration -> review -> migrate -> codegen -> run
```

- `bun run dev` in a generated app performs an idempotent database setup preflight.
- Standalone migration commands apply only that module's migrations.
- Framework startup checks readiness but never creates or changes tables.
- Production runs one explicit migration job before API or worker processes.

## Choosing the next read

- To build an app, continue to [Getting started](./03-getting-started.md).
- To compare execution choices, use [Workflows](./09-workflows.md),
  [Events and jobs](./10b-events-and-jobs.md), and
  [Durable pipelines](./10c-pipelines.md).

---

Prev: [← Execution primitives](./02ab-concepts-execution-primitives.md) · [Guide home](../GUIDE.md) · Next: [Getting started →](./03-getting-started.md)
