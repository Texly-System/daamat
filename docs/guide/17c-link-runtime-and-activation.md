[Damat Guide](../GUIDE.md) › Link runtime

# 17.2 Activate and query links

## Generate the junction migration and linked types

```bash
damat-orm migrate:create link:user
bun run db:migrate
damat codegen user
damat codegen organization
```

The migration belongs to the link owner (`link:user`). Codegen augments the
module row types with linked fields; it does not generate a public junction-row
type.

## Manage and fetch relationships

```ts
import { getModule } from "@damatjs/framework";

const link = getModule("link");

await link.create(
  { module: "user", model: "users", id: user.id },
  { module: "organization", model: "organizations", id: organization.id },
);

const organizations = await link.fetch(
  { module: "user", model: "users", id: user.id },
  { module: "organization", model: "organizations" },
);
```

`create` is idempotent and revives a dismissed pair. `dismiss` soft-deletes the
relationship. `fetch` returns rows from the linked module, not junction rows.

For nested reads, `link.graph()` follows declared link fields such as
`organizations.name`. It fetches through each module service rather than issuing
an unrestricted cross-module SQL join.

## Dormant shipped links

A module may ship a link template under its declared `links` capability. The
installer copies it into the app, but it stays dormant until the backend owner
reviews the endpoints, generates and applies a link migration, and runs codegen.
`pairsWith` is only a composition hint and never installs or activates anything.

---

Prev: [← Design a link](./17b-link-model-design.md) · [Guide home](../GUIDE.md) · Next: [CLI reference →](./18-cli-reference.md)
