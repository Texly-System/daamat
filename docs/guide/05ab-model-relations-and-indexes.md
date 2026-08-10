[Damat Guide](../GUIDE.md) › Defining models

# 5.2 Relations, indexes, and constraints

Relations may point only to tables owned by the same module. Use an app-owned
link when two independent modules need a relationship.

```ts
export const AccountModel = model("accounts", {
  id: columns.id({ prefix: "acc" }).primaryKey(),
  userId: columns.text(),
  provider: columns.text(),
  user: columns.belongsTo("users"),
})
  .indexes([
    columns.indexes().columns(["userId"]),
    columns.indexes().columns(["userId", "provider"]).unique(),
  ])
  .timestamps();
```

Timestamps and soft delete are enabled by default. Use `.timestamps(false)` or
`.softDelete(false)` only when the table intentionally opts out.

`indexes()` replaces the model's index list, so define related indexes in one
call. Table checks use `.constrain([columns.constrains(...)])`; see the package
reference for the exact builders.

## Vector indexes and nearest-neighbor search

Native `vector` and `halfvec` columns support PostgreSQL `hnsw` and `ivfflat`
indexes. Index columns can be named columns or SQL expressions and may specify a
vector operator class, storage parameters, a partial predicate, and concurrent
creation:

```ts
const Asset = model("asset", {
  id: columns.id({ prefix: "ast" }).primaryKey(),
  embedding: columns.halfVector(2048),
  embeddingModelRevision: columns.text(),
}).indexes([
  columns
    .indexes("asset_embedding_hnsw")
    .columns([{ name: "embedding", operatorClass: "halfvec_cosine_ops" }])
    .type("hnsw")
    .with({ m: 16, ef_construction: 64 })
    .where("embedding IS NOT NULL")
    .concurrently(),
]);
```

The supported operator classes are `vector_l2_ops`, `vector_cosine_ops`,
`vector_ip_ops`, `vector_l1_ops`, and their `halfvec_*` counterparts. For a
full-precision `VECTOR(2048)` column, an expression index can cast to halfvec
for ANN search and leave the stored value available for reranking:

```ts
columns
  .indexes("asset_embedding_halfvec_hnsw")
  .columns([{
    expression: "(embedding::halfvec(2048))",
    operatorClass: "halfvec_cosine_ops",
  }])
  .type("hnsw");
```

The generated expression is `((embedding::halfvec(2048)) halfvec_cosine_ops)`.
Use the `findNearest` repository method for typed distance queries:

```ts
const matches = await em.repo("asset").findNearest({
  column: "embedding",
  vector: queryEmbedding,
  distance: "cosine",
  limit: 20,
  where: { embeddingModelRevision: revision },
});
// Array<{ row: Asset; distance: number }>
```

`distance` maps to PostgreSQL operators as follows: `l2` → `<->`, `cosine` →
`<=>`, `innerProduct` (negative inner product) → `<#>`, and `l1` → `<+>`. Results
are ordered by ascending distance and returned as `{ row, distance }`. The
query vector is validated against the modeled column dimensions before SQL is
executed; `limit` is a positive integer capped at 1000.

For the Asset Inspiration workload, use `HALFVEC(2048)` with HNSW cosine
indexing as the initial production choice. Keep `VECTOR(2048)` with the
halfvec expression index above available when full single-precision storage and
reranking are required.

For a cross-module relationship:

1. Define the link under the app's `src/links/` directory.
2. Add `links: "./src/links"` to `damat.config.ts`.
3. Generate and apply the link-owner migration.
4. Regenerate linked module types.

Detailed references:
- [Link model design](./17b-link-model-design.md)
- [`@damatjs/link`](../../packages/link/README.md)

---

Prev: [← Model columns and types](./05aa-model-columns-and-types.md) · [Guide home](../GUIDE.md) · Next: [Migrations →](./06-migrations.md)
