[Damat Guide](../GUIDE.md) › Troubleshooting

# 21. Troubleshooting

Start with the first boundary that failed. Avoid blind restarts: they can hide a
missing migration, wrong runtime role, or repeatedly failing side effect.

## Database does not exist

Confirm `DATABASE_URL`, then run:

```bash
bun run db:setup
```

Creating the database requires `CREATEDB` or equivalent permission. If the
database already exists, use `bun run db:migrate`.

## Runtime reports missing migrations or tables

```bash
bun run db:status
bun run db:migrate
```

Framework startup is read-only. Generated development `bun run dev` scripts
perform the setup preflight; production and custom start scripts need an
explicit migration job.

## Unknown runtime mode or worker

Valid modes are `server`, `worker`, and `all`. Valid worker names are `jobs`,
`events`, and `pipelines`.

- `server` starts no workers.
- `worker` must select at least one enabled worker.
- Each selected worker needs its matching `services` configuration.

Check `damat.config.ts`, `DAMAT_RUNTIME_MODE`, and `DAMAT_WORKER_TYPES` together.

## Jobs remain queued

Check in order:

1. A process selects `jobs`.
2. The job definition is imported before bootstrap.
3. The definition and worker queue agree.
4. Jobs and durability migrations are current.
5. PostgreSQL is reachable.

Redis is not required. Its absence increases wake-up latency but does not remove
the queued run.

Continue by symptom:

- [Runtime and durability faults](./21b-troubleshooting-runtime.md)
- [Tooling and build faults](./21c-troubleshooting-tooling.md)

---

Prev: [← Package reference](./20-package-reference.md) · [Guide home](../GUIDE.md) · Next: [Runtime and durability faults →](./21b-troubleshooting-runtime.md)
