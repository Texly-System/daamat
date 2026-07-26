[Damat Guide](../GUIDE.md) › Getting started

# 3.2 Project structure walkthrough

Most feature work happens in `src/modules/` and `src/api/routes/`. The other
top-level folders compose behavior that belongs to the application as a whole.

## Starter tree

```text
my-app/
├── damat.config.ts
├── .env
├── package.json
└── src/
    ├── api/
    │   ├── middleware/
    │   └── routes/
    │       └── users/[userId]/route.ts
    ├── modules/
    │   └── user/
    │       ├── index.ts
    │       ├── service.ts
    │       ├── config/
    │       ├── models/
    │       ├── migrations/
    │       └── types/
    ├── links/
    ├── workflows/
    ├── jobs/
    ├── events/
    └── pipelines/
```

## What each area owns

`damat.config.ts` binds modules and providers once. Feature code then lives under
`src/modules/<name>/`.

- `damat.config.ts` registers modules, providers, links, durable services, and
  process roles.
- `src/modules/<id>/` owns one domain's models, migrations, service, and config.
- `src/api/routes/` maps folders to HTTP paths.
- `src/workflows/` contains in-process sagas shared by the app.
- `src/jobs/`, `src/events/`, and `src/pipelines/` contain durable definitions
  imported before framework startup.
- `src/links/` owns relationships between otherwise independent modules.

Generated row types and request schemas live under a module's `types/` folder.
Regenerate them with `damat codegen <module>` instead of editing them by hand.

---

Prev: [← Prerequisites and local run](./03a-prerequisites-and-local-run.md) · [Guide home](../GUIDE.md) · Next: [Configuration & environment →](./04-configuration.md)
