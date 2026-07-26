[Damat Guide](../GUIDE.md) › Defining models

# 5. Defining models (the ORM DSL)

The `model()` DSL is the source of truth for a module's PostgreSQL schema.
Models generate migration snapshots, row types, Zod schemas, and service
accessors, so keep one model per file and review every generated migration.

Move on to dedicated details:

- [Model columns and types →](./05aa-model-columns-and-types.md)
- [Relations, indexes, constraints →](./05ab-model-relations-and-indexes.md)

---

Prev: [← Configuration runtime startup](./04b-runtime-startup.md) · [Guide home](../GUIDE.md) · Next: [Model columns →](./05aa-model-columns-and-types.md)
