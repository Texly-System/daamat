[Damat Guide](../GUIDE.md) › Configuration runtime details

# 4.3 Choosing a runtime role

`runtime.mode` changes what the process starts after bootstrap.

- `server`: serve HTTP; never start durable workers.
- `worker`: run selected workers without an HTTP server.
- `all`: serve HTTP and run selected workers in one process.

## Worker names

- `jobs` for background work units.
- `events` for durable event handlers.
- `pipelines` for durable graph routing and internal pipeline nodes.

Workers are selected by name list in `runtime.workers`.

Direct job nodes in a pipeline still require a `jobs` worker. Durable event
delivery still requires an `events` worker.

## Typical deployment split

Use `all` for a small service or local development. In production, separate API
and worker processes when you need independent scaling or failure isolation:

```bash
DAMAT_RUNTIME_MODE=server bun run start
DAMAT_RUNTIME_MODE=worker DAMAT_WORKER_TYPES=jobs,events bun run start
```

---

Prev: [← Configuration environment layers](./04a-configuration-environment.md) · [Guide home](../GUIDE.md) · Next: [Runtime mode and startup](./04b-runtime-startup.md)
