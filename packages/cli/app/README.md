# @damatjs/cli-app

Application lifecycle commands for Damat-compatible backends. The capability
can run by itself or be composed into another CLI without importing the
`damat` executable.

```ts
import { composeCliCapabilities, runCli } from "@damatjs/cli";
import { appCliCapability } from "@damatjs/cli-app";

await runCli({
  name: "backend",
  version: "1.0.0",
  commands: composeCliCapabilities(appCliCapability),
});
```

It provides `create`, `clone`, `dev`, `start`, and `build`. Configuration is
optional: commands only read `damat.config.ts` when the operation needs it.
`build` runs the project's installed TypeScript compiler with
`bun run tsc --noEmit` before bundling; `--no-typecheck` skips that gate.
Created backends include a receiver `damat.json` for modules, routes,
workflows, jobs, events, pipelines, links, tests, migrations, models, and types.
Creation accepts a complete PostgreSQL URL or prompts for host, port, user,
password, and database. It writes the selected URL to `.env`, installs packages,
creates the database when necessary, and applies the durability, jobs, durable
events, and pipeline catalogs. Generated `bun run dev` repeats that idempotent
database setup before the runtime readiness check.
`damat create` initializes a `main` Git repository and commits the scaffold by
default; pass `--no-git` to skip all Git probing and setup. Missing Git or a
failed Git command only emits a recovery warning and leaves the scaffold intact.
Generated `damat.config.ts` sets `projectConfig.nodeEnv` to `production` only
when `NODE_ENV` is exactly `production`; an absent or other value uses
`development`.

- [Internals](./docs/README.md)
- [CLI framework](../../core/cli/README.md)
