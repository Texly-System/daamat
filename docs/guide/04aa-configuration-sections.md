[Damat Guide](../GUIDE.md) › Configuration

# 4.1 Configuration sections

Each top-level section has one responsibility:

- `projectConfig`: database and Redis URLs, release identity, logger, and HTTP.
- `services`: database/Redis options and workflow, job, event, pipeline settings.
- `runtime`: whether this process serves HTTP, runs workers, or does both.
- `modules`: module IDs and source paths.
- `providers`: role-to-module bindings such as `auth` or `payment`.
- `links`: the app-owned cross-module link directory.

```ts
import { defineConfig } from "@damatjs/framework";

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: { host: "0.0.0.0", port: 6543 },
  },
  modules: {
    user: { resolve: "./src/modules/user" },
  },
  links: "./src/links",
  services: {
    jobs: { queue: "default", concurrency: 4 },
    events: { durable: { concurrency: 4 } },
    pipelines: { queue: "pipelines", concurrency: 2 },
  },
  runtime: {
    mode: "all",
    workers: ["jobs", "events", "pipelines"],
  },
});
```

Selecting a worker without enabling its matching service fails startup. Binding
a provider to a missing or incompatible module also fails startup.

---

Prev: [← Configuration](./04-configuration.md) · [Guide home](../GUIDE.md) · Next: [Environment & variable layers →](./04a-configuration-environment.md)
