[Damat Guide](../GUIDE.md) › Defining models

# 5.1 Columns and types

Start with the smallest schema that expresses the database rules. Add indexes
and relations only after the columns are clear.

```ts
import { model, columns } from "@damatjs/orm-model";

export const UserModel = model("users", {
  id: columns.id({ prefix: "usr" }).primaryKey(),
  email: columns.text().unique(),
  name: columns.text().nullable(),
  isAdmin: columns.boolean().default(false),
  createdAt: columns.timestamp({ withTimezone: true }).defaultNow(),
});
```

Common builder families:

- identity: `id()`, `uuid()`
- strings: `text()`, `varchar()`, `char()`
- numbers: `integer()`, `numeric()`, `real()`, `doublePrecision()`
- time: `timestamp()`, `date()`, `time()`, `interval()`
- structured values: `json()`, `jsonb()`, `bytea()`, `vector()`

Modifiers such as `.primaryKey()`, `.unique()`, `.nullable()`, `.default()`,
and `.defaultNow()` describe database behavior. Changing a model does not alter
the database until you generate, review, and run a migration.

See package docs for exact options:
[`orm-model column reference`](../../packages/orm/model/docs/README.md)

---

Prev: [← Defining models](./05-models.md) · [Guide home](../GUIDE.md) · Next: [Relations and indexes →](./05ab-model-relations-and-indexes.md)
