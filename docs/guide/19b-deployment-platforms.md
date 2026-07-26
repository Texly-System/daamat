[Damat Guide](../GUIDE.md) › Deployment operations

# 19.1 Containers, health, and rollback

## Build the application and its dependencies

The reference backend uses a dependency-aware monorepo build, then runs one app
from the resulting image:

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /workspace
COPY . .
RUN bun install --frozen-lockfile
RUN bunx turbo run build --filter=@damatjs/default...

FROM oven/bun:1 AS runtime
WORKDIR /workspace
COPY --chown=bun:bun --from=build /workspace /workspace
USER bun
WORKDIR /workspace/backend/default
CMD ["bun", "run", "start"]
```

An application outside the monorepo can build its package directly. The runtime
image must include all production dependencies and the generated `.damat/dist`
bundle.

## Health and operations

- Point API liveness/readiness probes at `GET /health`.
- Headless workers do not need an HTTP server.
- Inspect worker capacity, attempts, failures, recovery, progress, and logs
  through the headless job, event, and pipeline clients.
- Put authentication and authorization around every administrative adapter.

## Verify Redis degradation

Test real durable jobs, event deliveries, and pipeline runs with Redis both
available and unavailable. Without Redis, PostgreSQL discovery should continue
processing with higher wake-up latency. Cache, locks, sessions, rate limits, and
ephemeral broadcast should be treated as Redis-dependent features.

Authenticated Redis users need channel access for `&damat:*` and
`&damat-events` when durable wake-ups or broadcast are enabled.

## Rollback and restore

Database migrations are forward-only and remain after an application image is
rolled back. A release must therefore preserve database compatibility with the
previous runtime image.

Before release approval:

1. Run the migration job before API and workers.
2. Exercise graceful shutdown and port reuse for each runtime role.
3. Confirm handlers tolerate at-least-once execution.
4. Back up PostgreSQL and restore into a disposable target.
5. Start the previous application image against the migrated schema.

Backups are not proven until a restore drill and real durable work succeed.

---

Prev: [← Deployment](./19-deployment.md) · [Guide home](../GUIDE.md) · Next: [Package reference →](./20-package-reference.md)
