[Damat Guide](../GUIDE.md) › Migrations

# 6. Migrations

Each module owns its migration history. An assembled app applies module, link,
and enabled system migrations in dependency order. Framework startup only
checks that this work is complete; it never changes the schema.

Never edit a migration that has already been applied. Generate a new migration
for the next schema change.

Use one of these pages first:

- [App migration workflow →](./06a-app-migrations.md)
- [Module migration workflow →](./06b-module-migrations.md)

---

Prev: [← Defining models](./05-models.md) · [Guide home](../GUIDE.md) · Next: [App migration workflow →](./06a-app-migrations.md)
