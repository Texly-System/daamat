import type { GuideSectionDefinition } from "../types";

export const buildSection: GuideSectionDefinition = {
  id: "build",
  title: "Build",
  chapters: [
    {
      id: "models",
      title: "Defining models (the ORM DSL)",
      summary:
        "Compose typed PostgreSQL schemas with fluent columns, relations, indexes, constraints, and migrations-ready model metadata.",
      file: "05-models.md",
      order: 5,
    },
    {
      id: "model-columns-and-types",
      title: "Model columns and types",
      summary:
        "Use column builders and modifiers to define stable types and defaults without ad-hoc SQL.",
      file: "05aa-model-columns-and-types.md",
      order: 5.01,
    },
    {
      id: "model-relations-and-indexes",
      title: "Relations, indexes, and constraints",
      summary:
        "Use module-local relations and constraints, then isolate cross-module links in app-owned link modules.",
      file: "05ab-model-relations-and-indexes.md",
      order: 5.02,
    },
    {
      id: "migrations",
      title: "Migrations",
      summary:
        "Plan schema changes safely across modules with generated snapshot diffs and shared durability/system migrations.",
      file: "06-migrations.md",
      order: 6,
    },
    {
      id: "app-migrations",
      title: "App migration workflow",
      summary:
        "Run host-owned migration setup, checks, and status commands for safe startup and deploy flow.",
      file: "06a-app-migrations.md",
      order: 6.01,
    },
    {
      id: "module-migrations",
      title: "Standalone module migration workflow",
      summary:
        "Use module migration commands in local module context and keep ownership boundaries intact.",
      file: "06b-module-migrations.md",
      order: 6.02,
    },
    {
      id: "modules-and-services",
      title: "Modules & services",
      summary:
        "Turn model definitions into typed domain services, typed credentials, and module entrypoints.",
      file: "07-modules-and-services.md",
      order: 7,
    },
    {
      id: "crud-reference",
      title: "Querying & the CRUD service",
      summary:
        "Use generated find/write APIs, where-operators, transactions, and optional read-cache/event/logging features.",
      file: "07b-crud-reference.md",
      order: 7.5,
    },
    {
      id: "crud-filters",
      title: "Querying options and filters",
      summary:
        "Master paging, filtering, sorting, and projection for generated service queries.",
      file: "07ba-crud-filters.md",
      order: 7.55,
    },
    {
      id: "crud-consistency",
      title: "Transactions and consistency",
      summary:
        "Understand transaction scopes, validation, caching, events, and query logging.",
      file: "07bb-crud-consistency.md",
      order: 7.6,
    },
    {
      id: "http-apis",
      title: "Building HTTP APIs",
      summary:
        "Design file-based route trees with Hono, typed handlers, validation, and predictable response conventions.",
      file: "08-http-apis.md",
      order: 8,
    },
    {
      id: "http-validation",
      title: "HTTP validation and composition",
      summary:
        "Split request validation and route middleware into predictable handler files.",
      file: "08ba-http-validation.md",
      order: 8.15,
    },
    {
      id: "authentication",
      title: "Authentication",
      summary:
        "Attach an auth provider, shape request principals, and secure routes with session/API-key based access.",
      file: "08b-authentication.md",
      order: 8.5,
    },
    {
      id: "authentication-implementation",
      title: "Authentication implementation",
      summary:
        "Implement the auth role using provider contracts and explicit route-level enforcement.",
      file: "08bd-authentication-implementation.md",
      order: 8.55,
    },
    {
      id: "providers",
      title: "Integration providers",
      summary:
        "Adopt provider role contracts (auth/payment/subscription) and expose clean integration seams from modules.",
      file: "08c-providers.md",
      order: 8.6,
    },
    {
      id: "provider-implementation",
      title: "Provider implementation and integration",
      summary:
        "Implement payment and subscription-like providers with typed role methods and explicit module binding.",
      file: "08d-provider-implementation.md",
      order: 8.65,
    },
    {
      id: "workflows",
      title: "Workflows (the saga engine)",
      summary:
        "Orchestrate local, compensable business steps with retries and timeouts while one process remains alive.",
      file: "09-workflows.md",
      order: 9,
    },
    {
      id: "workflow-implementation",
      title: "Implement a workflow",
      summary:
        "Build typed steps, compensation payloads, and a composed in-process saga.",
      file: "09a-workflow-implementation.md",
      order: 9.01,
    },
    {
      id: "workflows-reliability",
      title: "Workflow reliability and errors",
      summary: "Tune retries, timeouts, lock scope, and failure interpretation.",
      file: "09b-workflows-reliability.md",
      order: 9.1,
    },
    {
      id: "redis",
      title: "Redis acceleration and utilities",
      summary:
        "Add optional acceleration for cache, liveness, pub/sub, locks, sessions, and rate limiting without changing durability semantics.",
      file: "10-redis.md",
      order: 10.1,
    },
    {
      id: "redis-cache-rate-limits",
      title: "Cache and rate limits",
      summary:
        "Use typed cache helpers, tag-based invalidation, and Redis-based per-identity request limits.",
      file: "10aa-redis-cache-and-rate-limits.md",
      order: 10.2,
    },
    {
      id: "redis-locks-queues-sessions",
      title: "Locks, queues, and sessions",
      summary:
        "Protect critical sections and ephemeral queue patterns while keeping jobs/events durable in PostgreSQL.",
      file: "10ab-redis-locks-and-queues.md",
      order: 10.3,
    },
    {
      id: "events-and-jobs",
      title: "Events and background jobs",
      summary:
        "Build retryable async work and per-consumer event delivery with PostgreSQL-first persistence and observability.",
      file: "10b-events-and-jobs.md",
      order: 10.5,
    },
    {
      id: "events-and-jobs-runtime",
      title: "Define jobs and durable events",
      summary:
        "Define durable jobs/events, enable capabilities, and wire request-level transaction context.",
      file: "10ba-jobs-and-workers-runtime.md",
      order: 10.55,
    },
    {
      id: "publish-durable-work",
      title: "Publish durable work atomically",
      summary:
        "Queue jobs and publish durable events with transaction alignment and idempotency metadata.",
      file: "10baa-publish-durable-work.md",
      order: 10.56,
    },
    {
      id: "jobs-observability",
      title: "Inspect and recover durable work",
      summary:
        "Inspect failed work, retry safely, and understand operational semantics under Redis fallback.",
      file: "10bb-events-jobs-observability.md",
      order: 10.57,
    },
    {
      id: "durable-pipelines",
      title: "Durable pipelines",
      summary:
        "Persisted orchestration for restart-safe process flows with waits, branches, signals, and durable stage state.",
      file: "10c-pipelines.md",
      order: 10.6,
    },
    {
      id: "pipeline-definition",
      title: "Define a pipeline",
      summary:
        "Design node graphs with typed payload wiring, branches, loops, child pipelines, and resilient start/signal flows.",
      file: "10d-pipeline-definition.md",
      order: 10.7,
    },
    {
      id: "pipeline-runtime-and-signals",
      title: "Start and signal a pipeline run",
      summary:
        "Start pipeline runs and send durable signals with actor, reason, and idempotency context.",
      file: "10da-pipeline-runtime-and-signals.md",
      order: 10.75,
    },
    {
      id: "pipeline-operations",
      title: "Configure and operate pipelines",
      summary:
        "Configure workers, signals, migration readiness, retention, and production-safe fallback behavior.",
      file: "10e-pipeline-operations.md",
      order: 10.8,
    },
    {
      id: "logging",
      title: "Logging",
      summary:
        "Tune structured logs and outputs for local debugging, production diagnostics, and operational diagnostics.",
      file: "11-logging.md",
      order: 11,
    },
    {
      id: "default-backend",
      title: "The default backend, end to end",
      summary:
        "Follow the reference app end-to-end to map every subsystem to a real project structure.",
      file: "12-default-backend.md",
      order: 12,
    },
  ],
};
