[Damat Guide](../GUIDE.md) › Querying & the CRUD service

# 7.1 Querying & the CRUD service

Every model registered on a module service receives generated accessors:
`service.<model>.find`, `findMany`, `create`, `update`, and related methods.

Choose singular methods when one row is expected and bulk methods only when the
business operation intentionally affects several rows. In particular,
`update()` changes every match; use `updateOne()` when only one row may change.

## Method families

### Read methods

| Method      | Returns     | Typical use |
| ----------- | ----------- | ---------- |
| `find(options)`      | `T \| null` | Lookup by custom filters |
| `findMany(options)`  | `T[]`       | Paged list/search query |
| `findById(id)`       | `T \| null` | Primary-key lookup |
| `findOne(where)`     | `T \| null` | Convenient first-match helper |

### Write methods

| Method                                    | Returns     | Typical use |
| ----------------------------------------- | ----------- | ---------- |
| `create({ data })`                        | `T`         | Insert one row |
| `createMany({ data })`                    | `T[]`       | Insert multiple rows |
| `upsert({ data, onConflict, ... })`       | `T`         | Insert-or-update |
| `upsertMany({ data, onConflict, ... })`   | `T[]`       | Bulk insert-or-update |
| `update({ where, data })`                 | `T[]`       | Update matching rows |
| `updateOne({ where, data })`              | `T \| null` | Update one row |
| `delete({ where })`                       | `number`    | Remove rows |
| `softDelete({ where })`                   | `T[]`       | Mark as deleted when `.softDelete()` exists |
| `restore({ where })`                      | `T[]`       | Restore soft-deleted rows |
| `count({ where })`                        | `number`    | Count matching rows |
| `exists({ where })`                       | `boolean`   | Existence check |

Soft delete is enabled by default on ORM models and can be disabled with
`.softDelete(false)`. Normal reads exclude deleted rows unless
`withDeleted: true` is supplied.

Continue to the next pages for the options, filters, transaction behavior, and
service-level telemetry:

- [Query options and operators →](./07ba-crud-filters.md)
- [Transactions, validation, and observability →](./07bb-crud-consistency.md)

---

Prev: [← Modules & services](./07-modules-and-services.md) · [Guide home](../GUIDE.md) · Next: [Query options and operators →](./07ba-crud-filters.md)
