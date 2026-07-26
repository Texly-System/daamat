[Damat Guide](../GUIDE.md) › Configuration & environment

# 4.2 Environment loading and variables

Damat uses the same env cascade pattern as many Node runtimes:

```
.env.{environment}.local   ← highest priority
.env.{environment}
.env.local
.env                       ← lowest
```

Common values (the reference backend keeps this list in `.env.example`):

| Variable                | Required | Description |
| ----------------------- | -------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`          | Usually  | PostgreSQL URL for modules, durable work, inspection, and migrations |
| `REDIS_URL`             | —        | Optional cache/pub-sub/lock accelerator for faster wake-up and invalidation |
| `NODE_ENV`              | —        | `development`, `production`, or `test` |
| `PORT` / `HOST`         | —        | HTTP bind and host settings |
| `DAMAT_RUNTIME_MODE`    | —        | Overrides `runtime.mode`: `server`, `worker`, or `all` |
| `DAMAT_WORKER_TYPES`    | —        | Overrides worker names: comma-separated `jobs,events,pipelines` |
| `DAMAT_REGISTRY`        | —        | Registry source index for module resolution |
| `DAMAT_MODULE_VERIFY`   | —        | Install policy: `off`, `warn`, or `require` |

`DAMAT_MODULE_REGISTRY` is accepted as a compatibility alias for
`DAMAT_REGISTRY`. Modules declare their own environment requirements in
`damat.json`; review those requirements during installation.

If values are missing, module-specific startup can fail even when app-level values
are present.

---

Prev: [← Configuration sections in detail](./04aa-configuration-sections.md) · [Guide home](../GUIDE.md) · Next: [Runtime mode and worker safety →](./04ab-configuration-runtime-modes.md)
