[Damat Guide](../GUIDE.md) › Integration providers

# 8.4 Integration providers

A provider is a module service that is selected for a standardized role.

It is **not** a separate system type:

- `kind` remains `module`.
- module setup, migrations, routes, workflows, and storage are unchanged.
- the role binding is the contract point (`providers` in `damat.config.ts`).

Common provider roles:

- `auth` — principal lookup, session/token validation, API-key operations.
- `payment` — create/list/capture/refund and checkout-facing adapters.
- `subscription` — plan creation changes, state transitions, and webhook intake.

In this model, provider role callers use typed methods from `getProvider(role)`, and
your app code decides when to invoke provider methods.

```ts
import { getProvider } from "@damatjs/framework";

const auth = getProvider("auth");
const user = await auth.getPrincipal(userId);
```

For implementation and integration details, continue to the implementation page:

- [How to implement and wire providers →](./08d-provider-implementation.md)

---

Prev: [← Authentication implementation](./08bd-authentication-implementation.md) · [Guide home](../GUIDE.md) · Next: [Provider implementation →](./08d-provider-implementation.md)
