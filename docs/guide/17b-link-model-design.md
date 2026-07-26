[Damat Guide](../GUIDE.md) › Link model design

# 17.1 Design an app-owned link

A link stores a cross-module relationship in an app-owned junction table. The
two modules remain independent and never import each other.

```text
users <-> user_organization <-> organizations
```

## Define both endpoints

```ts
// src/links/user/models/user-organization.ts
import { defineLink } from "@damatjs/framework";

export default defineLink(
  { module: "user", model: "users", field: "users" },
  {
    module: "organization",
    model: "organizations",
    field: "organizations",
  },
);
```

- `module` is the ID used by `getModule`.
- `model` is the key in that module's collected model map and service.
- `field` is the relationship name exposed on the linked side.

The generated junction has a unique pair index, an index for each side, soft
delete, and timestamps. Cross-module database foreign keys are off by default
to preserve module isolation.

## Aggregate link owners

```text
src/links/
├── index.ts
└── user/
    ├── index.ts
    ├── models/user-organization.ts
    └── migrations/
```

The owner index exports `links` and `collectLinkModels(links)`. The top-level
index combines every owner and default-exports `defineLinkModule(links)`. Point
`damat.config.ts` at it with `links: "./src/links"`.

---

Prev: [← Compose modules](./17-composing-and-linking-modules.md) · [Guide home](../GUIDE.md) · Next: [Activate and query links →](./17c-link-runtime-and-activation.md)
