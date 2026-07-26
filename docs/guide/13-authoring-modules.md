[Damat Guide](../GUIDE.md) › Authoring a standalone module

# 13. Authoring a standalone module

A standalone module is one portable domain capability. It owns its models,
migrations, service, credentials, and optional routes or durable definitions.
It does not choose the host application's workers, queues, Redis policy,
retention, links, or deployment topology.

## Scaffold and run

```bash
bunx @damatjs/damat-cli@latest module init inventory
cd inventory
bun run dev
```

Initialization writes `.env`, installs dependencies, creates the development
database when needed, and applies this module's migrations. Generated scripts
expose each phase:

```bash
bun run database:setup
bun run migration:create
bun run migration:run
bun run migration:status
bun run codegen
bun run validate
bun run build
bun test
```

`bun run dev` also installs the shared catalogs required by the module's declared
jobs, durable events, or pipelines and starts local workers. These are local
development defaults; an assembled backend chooses production policy.

## Standard layout

```text
inventory/
├── damat.json
├── module.config.ts
├── package.json
├── .env
└── src/
    ├── index.ts
    ├── service.ts
    ├── config/
    ├── models/
    ├── migrations/
    ├── types/
    ├── lib/
    ├── workflows/
    ├── api/routes/
    ├── jobs/
    ├── events/
    ├── pipelines/
    ├── links/
    └── tests/
```

Only create optional directories when the module provides that capability.
Keep the package narrow enough that another app can understand its purpose from
`damat.json` without reading its implementation.

---

Prev: [← The default backend](./12-default-backend.md) · [Guide home](../GUIDE.md) · Next: [Service and layering →](./13b-module-service-and-layering.md)
