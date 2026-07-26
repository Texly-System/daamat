[Damat Guide](../GUIDE.md) › Migrations

# 6.2 Standalone module migrations

```bash
bun run migration:create
bun run database:setup
bun run migration:run
bun run migration:status
```

These scripts operate only on the module's models and migration folder.
`database:setup` creates the development database when needed, while
`migration:run` applies pending module migrations to `DATABASE_URL`.

The explicit migration scripts do not install shared system catalogs. `bun run
dev` is the development exception: it applies the module migration and the
catalogs required by declared jobs, durable events, or pipelines before it
starts local workers.

After installation, the assembled application owns the complete migration
order and runtime policy.

---

Prev: [← App migration workflow](./06a-app-migrations.md) · [Guide home](../GUIDE.md) · Next: [Modules & services →](./07-modules-and-services.md)
