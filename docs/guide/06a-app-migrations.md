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
`_damat_migration_logs`, making repeated status and migrate commands idempotent.
Creating a missing database requires `CREATEDB`; migrating an existing database
does not.

Next: [Standalone module migrations →](./06b-module-migrations.md)

---

Prev: [← Migrations](./06-migrations.md) · [Guide home](../GUIDE.md) · Next: [Module migrations →](./06b-module-migrations.md)
