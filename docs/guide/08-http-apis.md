[Damat Guide](../GUIDE.md) › Building HTTP APIs

# 8. Building HTTP APIs

The HTTP layer is file-based. Every `route.ts` in `src/api/routes/` becomes a
runtime route at startup. Routes validate transport input, call a workflow or
service, and shape the response; business orchestration belongs below HTTP.

```ts
// src/api/routes/posts/route.ts  ->  /api/posts
import type { RouteHandler } from "@damatjs/framework/router";

export const GET: RouteHandler = async (c) => {
  return c.json({ success: true, data: { posts: [] } });
};

export const POST: RouteHandler = async (c) => {
  return c.json({ success: true, data: await c.req.json() }, 201);
};
```

### File-to-URL mapping

- `src/api/routes/posts/route.ts` → `GET /api/posts`
- `src/api/routes/users/[userId]/route.ts` → `GET /api/users/:userId`
- `src/api/routes/files/[...path]/route.ts` → `GET /api/files/*`

`/api` is the default base path; tune it in `projectConfig.http.api.entryRouter`.

### Dynamic and typed params

`defineRoute<Params>` gives compile-time-safe params.

```ts
import { defineRoute } from "@damatjs/framework/router";

export const GET = defineRoute<{ userId: string }>(async (c, params) => {
  return c.json({ success: true, data: { id: params.userId } });
});
```

Use this to avoid manual `c.req.param()` parsing in handlers.

The router section below covers request validation, middleware split, and route config:

- [Validation and request contracts →](./08ba-http-validation.md)

---

Prev: [← Querying & CRUD consistency](./07bb-crud-consistency.md) · [Guide home](../GUIDE.md) · Next: [Validation and middleware →](./08ba-http-validation.md)
