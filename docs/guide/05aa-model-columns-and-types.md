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
- structured values: `json()`, `jsonb()`, `bytea()`, `vector(n)`, `halfVector(n)`

PostgreSQL `NUMERIC` keeps exact decimal values. Existing
`columns.numeric()` declarations continue to generate `number` types. Opt into
lossless row/input types and finite decimal-string Zod validation per column:

```ts
amount: columns.numeric(30, 8).representation("string");
```

The representation is codegen metadata only; changing it does not generate SQL.

## Native pgvector columns

Use `columns.vector(dimensions)` for PostgreSQL `VECTOR(dimensions)` or
`columns.halfVector(dimensions)` for `HALFVEC(dimensions)`. Both are scalar
PostgreSQL extension types with a dedicated `dimensions` field in the schema;
their TypeScript row and input representation is `number[]`.

```ts
const Asset = model("asset", {
  id: columns.id({ prefix: "ast" }).primaryKey(),
  embedding: columns.halfVector(2048),
  // A normal PostgreSQL array remains a different type:
  scores: columns.real().array(),
});
```

Dimensions must be positive integers. Generated schemas and runtime write/query
boundaries require exactly that many finite numbers, rejecting `NaN`, positive
infinity, and negative infinity before SQL runs. `.nullable()` and optional
input fields preserve their surrounding null/undefined behavior. Native vector
builders are not PostgreSQL arrays: `array = false`, and calling `.array()` on
one throws. Use `real().array()` or `doublePrecision().array()` when a regular
`REAL[]` or `DOUBLE PRECISION[]` is intended.

The PostgreSQL adapter registers the official `pgvector` types for every pool
connection, serializes modeled vector parameters with `pgvector.toSql()`, and
deserializes `VECTOR`/`HALFVEC` results to `number[]`. Application services do
not need to add casts or hand-written serializers.

Modifiers such as `.primaryKey()`, `.unique()`, `.nullable()`, `.default()`,
and `.defaultNow()` describe database behavior. Changing a model does not alter
the database until you generate, review, and run a migration.

See package docs for exact options:
[`orm-model column reference`](../../packages/orm/model/docs/README.md)

---

Prev: [← Defining models](./05-models.md) · [Guide home](../GUIDE.md) · Next: [Relations and indexes →](./05ab-model-relations-and-indexes.md)
