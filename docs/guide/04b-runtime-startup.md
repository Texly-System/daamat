[Damat Guide](../GUIDE.md) › Configuration & environment

# 4.4 Startup behavior and safety

Startup follows a strict sequence:

1. Load and validate `damat.config.ts`.
2. Create one PostgreSQL pool for the process.
3. Check required system and module migrations without changing the schema.
4. Initialize modules, provider bindings, links, and durable services.
5. Start HTTP and/or the selected workers.

If a migration is missing, startup stops with an actionable error. For a
generated app, use:

```bash
bun run db:status
bun run db:migrate
```

Development `bun run dev` performs an idempotent `db:setup` preflight.
Production should run one migration job before any API or worker replica starts.

## PostgreSQL and Redis during startup

HTTP, modules, jobs, events, pipelines, inspection, and maintenance share the
same bounded PostgreSQL pool. Do not create pools inside routes, services, or
workers.

An unavailable or unauthorized Redis connection degrades durable wake-ups to
PostgreSQL discovery. It does not transfer lease ownership or durable history
to Redis.

---

Prev: [← Runtime mode and worker safety](./04ab-configuration-runtime-modes.md) · [Guide home](../GUIDE.md) · Next: [Defining models →](./05-models.md)
