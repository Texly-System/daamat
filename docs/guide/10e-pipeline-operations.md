[Damat Guide](../GUIDE.md) › Pipeline operations

# 10.10 Configure and operate pipelines

Enable the pipeline service, select a pipeline worker, and apply migrations
before starting runtime processes.

```ts
export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: { host: "0.0.0.0", port: 6543 },
  },
  services: {
    jobs: { queue: "reports", concurrency: 4 },
    events: { durable: { concurrency: 4 } },
    pipelines: {
      queue: "pipelines",
      concurrency: 2,
      routerBatchSize: 100,
      maxNodeActivationsPerRun: 10_000,
      maxFanOut: 1_000,
      retentionMs: 90 * 24 * 60 * 60 * 1_000,
    },
  },
  runtime: {
    mode: "all",
    workers: ["jobs", "events", "pipelines"],
  },
});
```

The `pipelines` worker runs the graph router and internal action/workflow worker.
A direct `job` node also needs `services.jobs` and a job worker for its queue.
Durable event publish/wait nodes need durable event definitions; consumer
delivery needs event workers.

## Migrate before runtime

```bash
bun run db:status
bun run db:migrate
```

Framework startup checks migration readiness but never mutates schemas. A
standalone module's `bun run dev` installs only the catalogs needed for its
declared local capabilities; the assembled backend owns production policy.

## Inspect and control runs

The headless authoring client manages capability discovery, drafts, immutable
publication, activation, rollback to an older version, and layouts. The
inspection client returns the pinned graph, run and node states, transitions,
signals, activity, child lineage, and backing-job attempts and logs.

Pause, resume, cancel, node retry, trigger, and retention operations must be
wrapped in your application's authenticated admin surface. Redis invalidations
contain identity and revision only; clients refetch canonical PostgreSQL detail.

## Failure behavior

- PostgreSQL owns definitions, runs, signals, leases, history, and controls.
- Redis supplies wake-ups, ready projections, liveness, and invalidations.
- Redis loss falls back to bounded PostgreSQL discovery.
- Node handlers are at least once and must be idempotent.
- Pipeline history defaults to 90 days unless configured as `"forever"`.

---

Prev: [← Start and signal a run](./10da-pipeline-runtime-and-signals.md) · [Guide home](../GUIDE.md) · Next: [Logging →](./11-logging.md)
