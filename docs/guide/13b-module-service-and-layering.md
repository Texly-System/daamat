[Damat Guide](../GUIDE.md) › Module service and layering

# 13.1 Module service and layering

Use one direction for business behavior:

```text
route -> workflow -> step -> service -> ORM
```

- Routes validate transport input and shape HTTP responses.
- Workflows coordinate several compensable steps.
- Steps call service accessors or intentional service methods.
- Services own persistence and provider/domain integrations.
- Small `src/lib/` helpers isolate SDK details and pure transformations.

## Build the service from models

```ts
import { collectModels } from "@damatjs/orm-model";
import { ModuleService, defineModule } from "@damatjs/services";
import credentials from "./config";
import { Item } from "./models/item";

export const models = collectModels([Item]);

export class InventoryService extends ModuleService({ models }) {
  async reserveSku(sku: string, quantity: number) {
    // New domain behavior belongs here.
  }
}

export default defineModule("inventory", {
  service: InventoryService,
  credentials: credentials.load,
});
```

`ModuleService` already supplies generated CRUD. Do not add pass-through methods
such as `createItem()` that only call `this.items.create()`. Add methods for real
domain rules or provider behavior.

## Keep the boundary portable

- Relations may target only tables owned by this module.
- Cross-module data relationships belong to app-owned links.
- Credentials flow through the module schema and loader.
- Services and workers must not create their own PostgreSQL pools.
- Host queue, worker, retention, Redis, and deployment choices never belong in
  module defaults.

---

Prev: [← Authoring a standalone module](./13-authoring-modules.md) · [Guide home](../GUIDE.md) · Next: [Testing and publishing →](./13c-module-testing-and-publishing.md)
