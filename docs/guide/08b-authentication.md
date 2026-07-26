[Damat Guide](../GUIDE.md) › Authentication

# 8.2 Authentication

Authentication in Damat has two explicit layers:

- **Framework contract:** The framework normalizes credentials from headers and
  cookies, applies route auth settings, enforces 401 failures, and exposes the
  request principal in typed context helpers.
- **Provider module:** Your module defines identities, credentials, key storage,
  and verification behavior for the `auth` role.

This means security behavior is explicit, swappable, and unit-testable.

## Quick mental model

- A route can require auth with `auth: { type: "session" }`, `apiKey`, or
  `flexible`.
- Route auth is opt-in and never implies “all routes are private”.
- Public routes remain public unless explicitly secured.
- A protected request fails closed with `401` when no auth provider is bound.

```ts
export const config = {
  method: "GET",
  auth: { type: "session" },
};
```

When verification succeeds, route handlers can use context principal helpers and
request-scoped identity data (`user`, `userId`, optional `team`) stays available
for authorization checks.

Read next for provider implementation patterns and then move into provider contracts.

---

Prev: [← HTTP validation](./08ba-http-validation.md) · [Guide home](../GUIDE.md) · Next: [Authentication implementation →](./08bd-authentication-implementation.md)
