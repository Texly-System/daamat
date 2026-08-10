[Damat Guide](../GUIDE.md) › Migrations

# 6.1 App migrations

In a full app, migrations combine system catalogs and module-owned scripts.

```bash
bun run db:setup
bun run db:migrate
bun run db:status
```

Use `db:setup` for a new development database. It creates the configured
database when missing and applies every migration. Use `db:migrate` for an
existing database.

## Production sequence

1. Build the application image.
2. Run `bun run db:migrate` once as a release job.
3. Start API and worker processes only after that job succeeds.

Applied migrations are tracked by owner and migration ID in
`damat._damat_migration_logs`, making repeated status and migrate commands
idempotent. All framework-owned durability, job, event, and pipeline relations
live in the dedicated `damat` schema; application, module, and link tables stay
in their configured application schemas.

The 1.0.6 migration preflight moves an existing public migration tracker before
reading its history. Forward system migrations relocate the remaining legacy
`public._damat_*` tables with `ALTER TABLE ... SET SCHEMA`, preserving data,
indexes, constraints, identities, grants, and foreign keys. Never start 1.0.6
API or worker processes against a database that has not completed this step.

Creating a missing database requires `CREATEDB`. Creating the `damat` schema
requires database `CREATE`; migrating an already prepared database does not
require an administrative or superuser role.

Next: [Standalone module migrations →](./06b-module-migrations.md)

---

Prev: [← Migrations](./06-migrations.md) · [Guide home](../GUIDE.md) · Next: [Module migrations →](./06b-module-migrations.md)
