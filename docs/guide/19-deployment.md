[Damat Guide](../GUIDE.md) › Deployment

# 19. Deployment

One Damat build can serve HTTP, run selected durable workers, or do both. Any
platform that can run Bun and reach PostgreSQL can host it.

## Release sequence

Build once, migrate once, then start runtime roles:

```bash
bun run build
bun run db:migrate
bun run start
```

Run migration as a release job or one-shot container. API and worker processes
must wait for it to succeed because framework startup checks schema readiness
but never creates or changes tables.

Use `bun run db:setup` only when a development or provisioning role is allowed
to create the named database. Production migration roles normally connect to an
already provisioned database.

## PostgreSQL schema privileges

Damat keeps application relations in their configured schemas and framework
infrastructure in `damat`. The migration role owns or inherits the owner of that
schema and has `USAGE, CREATE`; when the schema is absent, it also needs database
permission to create it. A separate runtime role needs schema usage plus table
and sequence privileges, but it does not need schema creation:

```sql
GRANT USAGE ON SCHEMA damat TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA damat TO app_runtime;
GRANT USAGE, SELECT, UPDATE
  ON ALL SEQUENCES IN SCHEMA damat TO app_runtime;
```

For fresh installations, configure equivalent default privileges for objects
created later by the migration role. Existing tables retain their grants when
the 1.0.6 forward migration moves them from `public`, but the runtime role still
needs `USAGE ON SCHEMA damat`.

## One image, several roles

| Role | Environment | Responsibility |
| ---- | ----------- | -------------- |
| Migration | `DATABASE_URL` | Run `bun run db:migrate` once and exit |
| API | `DAMAT_RUNTIME_MODE=server` | Serve HTTP; no workers |
| Jobs | `DAMAT_RUNTIME_MODE=worker`, `DAMAT_WORKER_TYPES=jobs` | Run job workers |
| Events | `DAMAT_RUNTIME_MODE=worker`, `DAMAT_WORKER_TYPES=events` | Route and deliver durable events |
| Pipelines | `DAMAT_RUNTIME_MODE=worker`, `DAMAT_WORKER_TYPES=pipelines` | Route graphs and run internal nodes |

A pipeline with direct job nodes also needs job workers. Durable event consumer
delivery needs event workers. An `all` process is useful for small deployments,
but separate roles allow independent scaling and fault isolation.

## Required production inputs

- `NODE_ENV=production`
- `DATABASE_URL`
- optional `REDIS_URL`
- module credentials declared in installed manifests
- runtime mode and worker selection for each process

PostgreSQL is required for domain and durable state. Redis is optional for
durable correctness but required for any cache, lock, session, rate-limit, or
ephemeral cross-process broadcast feature you enable.

---

Prev: [← CLI reference](./18-cli-reference.md) · [Guide home](../GUIDE.md) · Next: [Containers, health, and rollback →](./19b-deployment-platforms.md)
