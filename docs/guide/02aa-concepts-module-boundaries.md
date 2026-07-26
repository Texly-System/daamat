[Damat Guide](../GUIDE.md) › Concepts

# 2.1 Module boundaries and portability

The easiest way to keep a module reusable is to separate **domain ownership**
from **application policy**. A module defines what it can do. The host decides
where and how those capabilities run.

## What a module owns

In Damat, a module owns:

- its models, migrations, service, and credential schema;
- optional routes, workflows, jobs, events, pipelines, and tests;
- provider implementation details when it supports a provider role.

The module is portable because it exports stable capabilities instead of global app logic.

```text
module/
├── damat.json
├── src/
│   ├── index.ts
│   ├── service.ts
│   ├── models/
│   ├── workflows/
│   ├── routes/
│   ├── jobs/
│   ├── events/
│   ├── pipelines/
│   └── migrations/
```

## What the application owns

The host app decides:

- module registration and the IDs used by `getModule`;
- links between modules;
- provider-role bindings;
- queues, worker selection, concurrency, retention, Redis policy, and deployment;
- authentication and authorization for operational tools.

This is why installers never edit shared app policy files automatically:
they preserve host-level control.

## A quick placement test

If code needs another module's table or chooses which workers run, it does not
belong inside a portable module. Put cross-module data relationships in app-owned
links and runtime choices in `damat.config.ts`.

---

Prev: [← Concepts and architecture](./02-concepts.md) · [Guide home](../GUIDE.md) · Next: [Execution primitives →](./02ab-concepts-execution-primitives.md)
