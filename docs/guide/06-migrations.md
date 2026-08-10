[Damat Guide](../GUIDE.md) › Migrations

# 6. Migrations

Each module owns its migration history. An assembled app applies module, link,
and enabled system migrations in dependency order. Framework startup only
checks that this work is complete; it never changes the schema.

Never edit a migration that has already been applied. Generate a new migration
for the next schema change.

## Native vector extensions and DDL

Models containing `columns.vector(n)` or `columns.halfVector(n)` carry an
additive `vector` extension requirement in the module schema snapshot. Initial
and incremental generation emits the extension before any table that uses the
native type:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
-- followed by the table DDL
"embedding" HALFVEC(2048) NOT NULL
```

Extension requirements are deduplicated and ordered deterministically, so
generating a second migration from an unchanged snapshot produces no diff.
The processor never generates `DROP EXTENSION`; an extension may be shared by
another module or table. Removing the last model use therefore requires an
explicit, separately reviewed database operation if removal is truly desired.

Changing a native vector's type (`VECTOR` ↔ `HALFVEC`) or its dimensions is a
manual-review migration. Diff generation records the change and emits a clear
manual-review comment rather than silently casting, truncating, or losing
values; the updated schema snapshot still advances so the next generation is
stable. Review the data and write an explicit SQL migration before applying the
change.

Use one of these pages first:

- [App migration workflow →](./06a-app-migrations.md)
- [Module migration workflow →](./06b-module-migrations.md)

---

Prev: [← Defining models](./05-models.md) · [Guide home](../GUIDE.md) · Next: [App migration workflow →](./06a-app-migrations.md)
