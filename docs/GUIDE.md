# The Damat Guide

A step-by-step walkthrough of Damat — from zero to a running, modular backend,
then deeper into every building block. The guide is split into short chapters so
it's easy to read and easy to publish as a docs site. A machine-readable map of
the whole thing (chapters + packages) lives in
[`guide.json`](./guide.json).

> **Starting with Damat?** Read [Introduction](./guide/01-introduction.md),
> [Concepts](./guide/02-concepts.md), including [Composition and durability runtime](./guide/02b-composition-and-durability-runtime.md), then follow
> [Getting started](./guide/03-getting-started.md). Already set up? Jump straight
> to the chapter you need below.

---

## Choose your learning path

- **New to Damat:** read [Start here](#start-here) in order.
- **Building or authoring modules:** read [Modules & sharing](#modules--sharing), then jump to workflow/operations topics.
- **Operating production workloads:** read [Operate & reference](#operate--reference) and [Troubleshooting](./guide/21-troubleshooting.md) first.

---

## Chapters

### Start here

1. [Introduction](./guide/01-introduction.md) — what Damat is and the package map
2. [Concepts and architecture](./guide/02-concepts.md) — modules, durable primitives, PostgreSQL, Redis, and process roles
   - 2.1 [Module boundaries and portability](./guide/02aa-concepts-module-boundaries.md) — host ownership, module portability, and capability boundaries
   - 2.2 [Execution primitives](./guide/02ab-concepts-execution-primitives.md) — route, workflow, local event, job, durable event, and pipeline selection
   - 2.3 [Composition and durability runtime](./guide/02b-composition-and-durability-runtime.md) — PostgreSQL truth, Redis behavior, and runtime roles
3. [Getting started](./guide/03-getting-started.md) — scaffold, database creation, migrations, and project structure
   - 3.1 [Prerequisites and first local run](./guide/03a-prerequisites-and-local-run.md) — create an app or run the reference backend
   - 3.2 [Project structure walkthrough](./guide/03b-app-structure.md) — how code ownership is split across modules and app-owned folders
4. [Configuration & environment](./guide/04-configuration.md) — `damat.config.ts`, runtime workers, and environment variables
   - 4.1 [Configuration sections](./guide/04aa-configuration-sections.md) — `projectConfig`, `services`, `runtime`, `modules`, `providers`, and `links`
   - 4.2 [Environment loading and variables](./guide/04a-configuration-environment.md) — variable precedence and required values
   - 4.3 [Choosing a runtime role](./guide/04ab-configuration-runtime-modes.md) — `server`, `worker`, and `all` process responsibilities
   - 4.4 [Startup behavior and safety](./guide/04b-runtime-startup.md) — migration readiness, one-pool ownership, and Redis fallback

### Build

5. [Defining models (the ORM DSL)](./guide/05-models.md)
   - 5.1 [Model columns and types](./guide/05aa-model-columns-and-types.md) — core types, modifiers, and field-level design
   - 5.2 [Relations, indexes, and constraints](./guide/05ab-model-relations-and-indexes.md) — module-local relations and app-owned links
6. [Migrations](./guide/06-migrations.md)
   - 6.1 [App migrations](./guide/06a-app-migrations.md) — app migration setup, status, and production sequence
   - 6.2 [Standalone module migrations](./guide/06b-module-migrations.md) — module-only migration commands and local catalogs
7. [Modules & services](./guide/07-modules-and-services.md)
   - 7.1 [Querying & CRUD](./guide/07b-crud-reference.md) — generated read and write methods
   - 7.2 [Query options and filters](./guide/07ba-crud-filters.md) — paging, sorting, projection, and predicates
   - 7.3 [Transactions and consistency](./guide/07bb-crud-consistency.md) — transactions, validation, cache, events, and query logs
8. [Building HTTP APIs](./guide/08-http-apis.md)
   - 8.1 [Validation and middleware](./guide/08ba-http-validation.md) — schema checks, three-file routes, and service access
   - 8.2 [Authentication](./guide/08b-authentication.md) — framework enforcement and provider ownership
   - 8.3 [Authentication implementation](./guide/08bd-authentication-implementation.md) — secret-safe auth methods and route wiring
   - 8.4 [Integration providers](./guide/08c-providers.md) — auth, payment, and subscription role model
   - 8.5 [Provider implementation](./guide/08d-provider-implementation.md) — complete contracts, SDK helpers, and explicit binding
9. [Workflows (the saga engine)](./guide/09-workflows.md)
   - 9.1 [Workflow implementation](./guide/09a-workflow-implementation.md) — typed steps, compensation payloads, and execution results
   - 9.2 [Workflow reliability and errors](./guide/09b-workflows-reliability.md) — retries, timeouts, locks, and crash limitations
10. [Redis acceleration and utilities](./guide/10-redis.md)
    - 10.1 [Cache and rate limits](./guide/10aa-redis-cache-and-rate-limits.md) — typed cache helpers and distributed request limits
    - 10.2 [Locks, queues, sessions, and counters](./guide/10ab-redis-locks-and-queues.md) — Redis-owned coordination and its durability limits
    - 10.3 [Events and background jobs](./guide/10b-events-and-jobs.md) — local events, durable events, and jobs
    - 10.4 [Define jobs and durable events](./guide/10ba-jobs-and-workers-runtime.md) — stable definitions, handlers, services, and workers
    - 10.5 [Publish durable work atomically](./guide/10baa-publish-durable-work.md) — transaction executors, deduplication, and idempotency
    - 10.6 [Inspect and recover durable work](./guide/10bb-events-jobs-observability.md) — headless inspection, controls, and diagnosis
    - 10.7 [Durable pipelines](./guide/10c-pipelines.md) — choosing durable orchestration over a local saga
    - 10.8 [Define a pipeline](./guide/10d-pipeline-definition.md) — registered capabilities, JSON references, branches, and output
    - 10.9 [Start and signal a pipeline run](./guide/10da-pipeline-runtime-and-signals.md) — idempotent starts, buffered signals, and transaction executors
    - 10.10 [Configure and operate pipelines](./guide/10e-pipeline-operations.md) — workers, migrations, inspection, controls, and fallback
11. [Logging](./guide/11-logging.md)
12. [The default backend, end to end](./guide/12-default-backend.md)

### Modules & sharing

13. [Authoring a module](./guide/13-authoring-modules.md) — build one self-contained module (the blade)
   - 13.1 [Module service and layering](./guide/13b-module-service-and-layering.md) — route, workflow, step, service, and ORM boundaries
   - 13.2 [Test and prepare a module](./guide/13c-module-testing-and-publishing.md) — harnessed tests, validation, and install guidance
14. [Installing existing modules](./guide/14-installing-modules.md)
    - 14.1 [Plan and integrate an install](./guide/14aa-module-install-flow.md) — destinations, trust review, and host-owned wiring
    - 14.2 [Source, package, and lifecycle](./guide/14ab-module-package-lifecycle.md) — install modes, trust, update, and removal
    - 14.3 [Publish modules to a registry](./guide/14b-publishing-modules.md) — registry publication and verification
15. [Installing modules with AI (MCP)](./guide/15-installing-modules-with-ai.md)
16. [Module capabilities](./guide/16-module-capabilities.md) — everything one module can do
    - 16.1 [Durable module capabilities](./guide/16b-provider-capabilities.md) — jobs, durable events, pipelines, and stable identities
    - 16.2 [Installation and runtime ownership](./guide/16c-capabilities-installation-and-runtime.md) — transactions, host activation, and readiness
17. [Composing & linking modules](./guide/17-composing-and-linking-modules.md) — the backend owner assembles the blades
    - 17.1 [Design an app-owned link](./guide/17b-link-model-design.md) — junction ownership and endpoint contracts
    - 17.2 [Activate and query links](./guide/17c-link-runtime-and-activation.md) — migrations, generated types, runtime queries, and dormant templates

### Operate & reference

18. [CLI reference](./guide/18-cli-reference.md)
19. [Deployment](./guide/19-deployment.md)
   - 19.1 [Containers, health, and rollback](./guide/19b-deployment-platforms.md)
20. [Package reference](./guide/20-package-reference.md)
21. [Troubleshooting](./guide/21-troubleshooting.md)
   - 21.1 [Runtime and durability faults](./guide/21b-troubleshooting-runtime.md)
   - 21.2 [Tooling and build faults](./guide/21c-troubleshooting-tooling.md)

---

## Learn by outcome

| Outcome | Start here |
| ------- | ---------- |
| I want to create a runnable app quickly | [Composition and durability runtime](./guide/02b-composition-and-durability-runtime.md) → [Getting started](./guide/03-getting-started.md) |
| I need durable jobs, events, or pipelines | [Events and background jobs](./guide/10b-events-and-jobs.md) → [Publish durable work atomically](./guide/10baa-publish-durable-work.md) → [Inspect and recover durable work](./guide/10bb-events-jobs-observability.md) → [Durable pipelines](./guide/10c-pipelines.md) → [Define a pipeline](./guide/10d-pipeline-definition.md) → [Start and signal a run](./guide/10da-pipeline-runtime-and-signals.md) → [Operate pipelines](./guide/10e-pipeline-operations.md) |
| I want to ship a reusable module | [Authoring a module](./guide/13-authoring-modules.md) |
| I need module install and registry workflows | [Installing existing modules](./guide/14-installing-modules.md) |
| I am debugging startup or runtime issues | [Troubleshooting](./guide/21-troubleshooting.md) |

---

## How this guide is organized

- This page is the **index**. Each chapter is a standalone page under
  [`docs/guide/`](./guide/) with prev/next navigation.
- **Usage** lives here. For the **internals** of any package (if you're changing
  its code), follow the _Internals_ links into each package's `docs/` folder, or
  see the [Package reference](./guide/20-package-reference.md).
- Related top-level docs: the [module manifest contract (MODULES.md)](../MODULES.md)
  and the [AI contributor guide (AGENTS.md)](../AGENTS.md).

## Building a docs site

The chapter files are plain Markdown with a stable order (`NN-*.md`).
[`guide.json`](./guide.json) describes the full navigation tree — sections,
chapters (id, title, slug, path, summary), the package docs, and top-level docs —
so a static-site generator can build the sidebar and routes without parsing
Markdown. Slugs and ordering there are the source of truth for a site.
