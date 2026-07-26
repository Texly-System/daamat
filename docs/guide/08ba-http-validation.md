[Damat Guide](../GUIDE.md) › Building HTTP APIs

# 8.1 HTTP validation and route composition

Validators run before handlers and place parsed values in the request context.
This keeps body parsing, parameter checks, and query coercion out of business
logic.

## Request validation

A route can export a `validators` array, one `RouteValidator` per method:

```ts
import type { RouteValidator } from "@damatjs/framework/router";
import { PostsParamsSchema, updatePostsSchema } from "@blog/types";

export const validators: RouteValidator[] = [
  { method: "GET", params: PostsParamsSchema },
  { method: "PATCH", params: PostsParamsSchema, body: updatePostsSchema },
  { method: "DELETE", params: PostsParamsSchema },
];
```

Handlers read validated values through `getValidated`.

```ts
import { getValidated, type RouteHandler } from "@damatjs/framework/router";
import type { PostsParams, UpdatePosts } from "@blog/types";

export const PATCH: RouteHandler = async (c) => {
  const { id } = getValidated<PostsParams>(c, "params");
  const data = getValidated<UpdatePosts>(c, "body");
  // call service/workflow with clean values
};
```

## Three-file convention

Route mount point remains `route.ts`, but handlers and validators usually move to
`api.ts` and `validator.ts`:

```ts
// src/api/routes/posts/[id]/route.ts
export { GET, PATCH, DELETE } from "./api";
export { validators } from "./validator";
// export { middleware } from "./middleware";
```

## Reach services and middleware

Inside a handler, use `getModule(id)` to call generated accessors and service
methods:

```ts
import { getModule } from "@damatjs/framework";

const users = getModule("user");
await users.users.find({ where: { id: userId } });
```

Cross-cutting middleware lives in `src/api/middleware/`; route-specific middleware
and config can live in the route module.

For provider-based auth wiring and secure routes, continue to the next chapter.

---

Prev: [← Building HTTP APIs](./08-http-apis.md) · [Guide home](../GUIDE.md) · Next: [Authentication →](./08b-authentication.md)
