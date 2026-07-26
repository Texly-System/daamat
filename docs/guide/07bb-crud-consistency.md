[Damat Guide](../GUIDE.md) › Querying & the CRUD service

# 7.3 Transactions, validation, and observability

Use a transaction when several database operations must commit or roll back as
one unit. Optional cache, event, and query-log wrappers solve different problems;
they do not change the database transaction rules.

## Transactions

`transaction` runs service calls atomically with optional isolation settings.

```ts
await this.transaction(
  async () => {
    const user = await this.user.create({ data: { email } });
    await this.account.create({ data: { userId: user.id, provider } });
    return user;
  },
  { isolationLevel: "SERIALIZABLE" },
);
```

If the callback throws, all pending writes roll back.

The callback owns one checked-out PostgreSQL client. Await executor-backed
queries sequentially; do not run concurrent `Promise.all` queries through that
single transaction executor.

`TransactionOptions` includes:

- `isolationLevel`: `READ UNCOMMITTED` | `READ COMMITTED` | `REPEATABLE READ` | `SERIALIZABLE`
- `readOnly`
- `deferrable`

## Validation

`create`, `update`, and `upsert` validate payloads against generated Zod schemas
(before DB write), preventing low-quality data from entering persisted state.

## Opt-in read caching, events, and query logging

Enable these on the service class when you want more behavior:

```ts
class UserService extends ModuleService({
  models,
  cache: { defaultTtl: 60, prefix: "user" },
  events: true,
  logQueries: true,
}) {}
```

- **Read caching** (`cache: true` per read): Redis-backed by default when
  configured. Cache reads default to service TTL and can carry tags for invalidation.
  Any write path bypasses cache reads inside a transaction. Unavailable Redis
  means DB reads continue (`fail-open`), not cache corruption.
- **Model events** (`events: true`): emits CRUD event messages after writes.
- **Query logging** (`logQueries: true`): emits per-call duration metadata for
  troubleshooting, without leaking raw SQL.

The service cache invalidation strategy intentionally stays conservative: writes
invalidate reads for affected model paths.

> **Transaction caveat:** model events and cache invalidation run when each CRUD
> call succeeds, not after the surrounding transaction commits. A later rollback
> does not retract an emitted local event or restore an invalidated cache entry.
> Use durable events with the transaction executor when another process must act
> only after the domain write commits.

Continue to Redis and workflow pages to see where these helpers integrate.

---

Prev: [← Query options and filters](./07ba-crud-filters.md) · [Guide home](../GUIDE.md) · Next: [Building HTTP APIs →](./08-http-apis.md)
