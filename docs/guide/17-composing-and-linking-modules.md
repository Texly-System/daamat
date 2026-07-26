[Damat Guide](../GUIDE.md) › Composing modules

# 17. Compose and link modules

The application assembles independent modules in two ways:

- **Behavioral composition:** call another module's public service through
  `getModule(id)`.
- **Data composition:** create an app-owned link between models without adding
  cross-module foreign keys to either module.

## Register and call modules

```ts
export default defineConfig({
  modules: {
    user: { resolve: "./src/modules/user" },
    organization: { resolve: "./src/modules/organization" },
  },
});
```

```ts
import { getModule } from "@damatjs/framework";

const users = getModule("user");
const organizations = getModule("organization");

const user = await users.users.create({ data: { email: "a@b.co" } });
const organization = await organizations.organizations.findById(orgId);
```

Use service calls when one capability needs another capability's behavior. Use
a link when the application must persist and query a relationship between two
module-owned records.

---

Prev: [← Capability runtime ownership](./16c-capabilities-installation-and-runtime.md) · [Guide home](../GUIDE.md) · Next: [Design a link →](./17b-link-model-design.md)
