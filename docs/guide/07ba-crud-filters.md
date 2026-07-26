[Damat Guide](../GUIDE.md) › Querying & the CRUD service

# 7.2 Query options and filters

`findMany` combines filtering, projection, relation loading, sorting, and bounded
pagination. Keep API-level limits explicit so callers cannot request an
unbounded result set.

## Find options

```ts
interface FindOptions {
  select?: string[];
  where?: WhereClause;
  orderBy?: Array<{
    column: string;
    direction?: "ASC" | "DESC";
    nulls?: "NULLS FIRST" | "NULLS LAST";
  }>;
  skip?: number;
  take?: number; // capped by the generated MAX_PAGE_SIZE
  include?: string[];
  withDeleted?: boolean;
}
```

```ts
const admins = await users.users.findMany({
  where: { role: "admin", createdAt: { gte: since } },
  orderBy: [{ column: "createdAt", direction: "DESC" }],
  select: ["id", "email"],
  take: 50,
});
```

## Operator map

A `where` value is either a direct value (equals) or an operator object.

| Operator                     | Meaning |
| --------------------------- | ------- |
| `eq` / `neq`                | equals / not equals |
| `gt` / `gte` / `lt` / `lte` | comparisons |
| `like` / `ilike`            | string pattern matches |
| `in` / `notIn`              | value set checks |
| `isNull` / `isNotNull`      | null checks |
| `between`                   | inclusive range |

```ts
await posts.posts.findMany({
  where: {
    title: { ilike: "%damat%" },
    status: { in: ["published", "featured"] },
    deletedBy: { isNull: true },
  },
});
```

If your API needs nested or cross-model filters, review generated model scopes in
`@damatjs/orm` docs after confirming base `where` operators here.

---

Prev: [← Querying & CRUD](./07b-crud-reference.md) · [Guide home](../GUIDE.md) · Next: [Transactions and consistency →](./07bb-crud-consistency.md)
