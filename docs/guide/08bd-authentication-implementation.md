[Damat Guide](../GUIDE.md) › Authentication implementation

# 8.3 Implement an authentication provider

Damat provides an authentication contract and request binding, not an identity
database or vendor adapter. Your auth module owns identities, credential
verification, sessions, API keys, and account routes.

## Extend the strict auth service

`AuthProviderService` extends `ModuleService`, so the provider keeps generated
model accessors, transactions, credentials, cache, and events.

```ts
import { AuthProviderService } from "@damatjs/provider-auth";
import { models } from "./models";

const Base = AuthProviderService({ models });

export class AuthService extends Base {
  async authenticate(credentials) {
    const claims = credentials.bearerToken
      ? await verifyToken(credentials.bearerToken)
      : null;
    return claims ? { id: claims.sub, email: claims.email } : null;
  }

  getPrincipal(id) {
    return this.users.findById(id);
  }

  issueApiKey(input) {
    return issueAndStoreDigest(input);
  }

  getApiKey(id) {
    return findSafeKeyRecord(id);
  }

  listApiKeys(input) {
    return listSafeKeyRecords(input);
  }

  verifyApiKey(credentials) {
    return credentials.apiKey ? verifyStoredDigest(credentials.apiKey) : null;
  }

  async revokeApiKey(id) {
    await this.apiKeys.update({ where: { id }, data: { revoked: true } });
  }
}
```

The strict base makes missing operations a TypeScript error. API-key inspection
must never return the secret or its stored digest. Only key issue or rotation
returns a new plaintext secret, once; store a one-way digest.

## Bind the module to the auth role

```ts
modules: {
  auth: { resolve: "./src/modules/auth" },
},
providers: {
  auth: { module: "auth" },
},
```

Startup initializes the module once and binds that same service instance to the
role. Protected routes fail closed if the binding is missing or incompatible.

## Protect a route explicitly

```ts
import { defineRoute, getUser } from "@damatjs/framework";

export const config = { method: "GET", auth: { type: "apiKey" } };
export const GET = defineRoute((context) =>
  context.json({ success: true, data: getUser(context) }),
);
```

Binding auth does not make every route private. Sign-up, recovery, OAuth, and
API-key management remain ordinary module routes that you define and secure.

---

Prev: [← Authentication](./08b-authentication.md) · [Guide home](../GUIDE.md) · Next: [Integration providers →](./08c-providers.md)
