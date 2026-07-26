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

`indexes()` replaces the model's index list, so define related indexes in one
call. Table checks use `.constrain([columns.constrains(...)])`; see the package
reference for the exact builders.

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
