[Damat Guide](../GUIDE.md) › Modules & services

# 7. Modules & services

A module turns one domain's models into a typed service and a portable runtime
entry. The application registers that entry and supplies shared infrastructure.

A module owns one domain slice:

- ORM models and migrations,
- typed service with generated accessors,
- typed credentials definitions,
- module registration and optional routes/workflows.

The app chooses modules and binds shared infrastructure.

```ts
import { collectModels } from "@damatjs/orm-model";
import { ModuleService } from "@damatjs/services";

export const models = collectModels([
  // model("users", ...),
  // model("posts", ...),
]);

export class UserService extends ModuleService({ models }) {}
```

`collectModels` derives camel-cased accessor keys from table names, so plural
tables such as `users` and `posts` become `service.users` and `service.posts`.
`ModuleService` already provides complete CRUD for each key. Custom service
methods should add domain or provider behavior, not wrap generated CRUD.

Read the service and query patterns in the next pages:

- [Querying & CRUD →](./07b-crud-reference.md)

---

Prev: [← Migrations](./06-migrations.md) · [Guide home](../GUIDE.md) · Next: [Querying & CRUD →](./07b-crud-reference.md)
