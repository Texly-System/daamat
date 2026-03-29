# Damat

**A composable backend framework for TypeScript/Node.js.**

Damat gives you a modular, production-ready backend built from independent, plug-and-play building blocks. Rather than picking a monolithic framework and fighting its opinions, you assemble exactly what your application needs — database layer, authentication, billing, queues, workflows, and more — each as a self-contained module.

> Built with Bun, Hono, MikroORM, Effect-TS, Better Auth, and PostgreSQL.

---

## What is Damat?

Damat is a **composable backend engine** inspired by Medusa.js's module-first architecture. Every domain concern (users, teams, billing, API keys, webhooks) is a fully independent module with its own entities, service, credentials, and migrations. Modules are registered in a single config file and automatically wired to the database at startup.

On top of the module system, Damat provides:

- A **fluent ORM model DSL** for type-safe schema definitions
- **Six service base class families** covering database CRUD, external APIs, background queues, service composition, and data aggregation
- A **saga/workflow engine** (via Effect-TS) with automatic compensation and distributed locking
- A **production-ready default backend** wiring everything together with auth, teams, billing, rate limiting, and webhooks

---

## Monorepo Structure

This is a Bun-powered [Turborepo](https://turborepo.dev) monorepo.

```
damat/
├── backend/
│   └── default/               # @damatjs/default — Reference backend app
│       ├── damat.config.ts    # App config entry point
│       ├── docker-compose.yml # PostgreSQL (pgvector) + Redis + Adminer
│       └── src/
│           ├── api/           # File-based Hono routes (v1)
│           ├── modules/       # user, core modules
│           ├── workflows/     # Saga workflows (e.g. create team)
│           ├── links/         # Cross-module link definitions
│           └── lib/           # Logger, Redis, DB, workflow helpers
│
└── packages/
    ├── core/
    │   ├── framework/         # @damatjs/framework — Core framework
    │   └── types/             # @damatjs/types — Shared TypeScript types
    ├── service/               # @damatjs/services — Base service classes
    ├── orm/
    │   ├── model/             # @damatjs/orm-model — Fluent model DSL
    │   ├── connector/         # @damatjs/orm-connector — DB connections
    │   ├── migration/         # @damatjs/orm-migration — Module migrations
    │   ├── pg/                # @damatjs/orm-pg — pg execution layer
    │   └── processor/         # @damatjs/orm-processor — Schema processor
    ├── deps/                  # @damatjs/deps — All external deps re-exported
    ├── utils/                 # @damatjs/utils — Logger, config, Redis, router, env
    ├── workflow-engine/       # @damatjs/workflow-engine — Saga orchestration
    ├── cli/
    │   └── create-damat-app/  # @damatjs/create-damat-app — Project CLI
    └── typescript-config/     # Shared tsconfig presets
```

---

## Core Concepts

### Modules

Every domain is a self-contained module. A module defines its entities, service, credentials schema, and points to its migrations folder.

```typescript
// src/modules/user/index.ts
import { defineModule } from "@damatjs/services";
import { UserService } from "./service";
import { UserEntity } from "./entities";
import { z } from "zod";

export default defineModule("user", {
  service: UserService,
  credentials: {
    schema: z.object({ jwtSecret: z.string().min(32) }),
    load: (env) => ({ jwtSecret: env.JWT_SECRET }),
  },
  migrationsPath: "./src/modules/user/migrations",
});
```

Register modules in `damat.config.ts` and they are automatically initialized and migrated:

```typescript
// damat.config.ts
import { defineConfig } from "@damatjs/utils";
import userModule from "./src/modules/user";

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      port: 3000,
      jwtSecret: process.env.JWT_SECRET,
      corsOrigin: process.env.CORS_ORIGIN,
    },
  },
  modules: [userModule],
});
```

### ORM Model DSL

Define database models with a fluent, type-safe API. Models auto-generate `TableSchema` objects and TypeScript interface strings.

```typescript
import { model, columns } from "@damatjs/orm-model";

export const UserModel = model("users", {
  id: columns.id(),
  email: columns.varchar(255),
  name: columns.text().nullable(),
  isActive: columns.boolean().default(true),
  createdAt: columns.timestamp().defaultNow(),
  // Relations
  teams: columns.hasMany(() => TeamMemberModel),
});
```

Supported column types: `id`, `text`, `varchar`, `boolean`, `integer`, `decimal`, `timestamp`, `json`, `uuid`, `primaryKey`, and all relation types (`hasMany`, `belongsTo`, `hasOne`).

### Service Base Classes

`@damatjs/services` provides six base class families for every service pattern:

#### 1. `BaseModuleService` — Database CRUD

Full CRUD operations backed by MikroORM. Use `ModuleService(entities, schema)` to auto-generate a complete service from your entity list.

```typescript
import { ModuleService } from "@damatjs/services";
import { UserEntity } from "./entities";

export class UserService extends ModuleService([UserEntity]) {
  // create, createMany, findById, findOne, findAll, list (paginated),
  // update, updateMany, delete, deleteMany, softDelete, count, exists
  // — all generated automatically

  // Add custom methods:
  async findByEmail(email: string) {
    return this.findOne({ email });
  }
}
```

#### 2. `BaseExternalApiService` / `BaseHttpApiService` — External APIs

Retry logic with exponential backoff and a circuit breaker (closed/open/half-open states).

```typescript
import { BaseHttpApiService } from "@damatjs/services";

export class StripeService extends BaseHttpApiService {
  constructor() {
    super({ baseUrl: "https://api.stripe.com", timeout: 10_000, retries: 3 });
  }

  async getCustomer(id: string) {
    return this.get<StripeCustomer>(`/v1/customers/${id}`);
  }
}
```

#### 3. `BaseQueueService` — Background Jobs

In-memory queue in development, Redis-backed in production. Supports priority levels, delays, batch enqueue, retries, and job lifecycle tracking.

```typescript
import { BaseQueueService } from "@damatjs/services";

export class EmailQueue extends BaseQueueService<EmailJobData> {
  async process(job: Job<EmailJobData>) {
    await sendEmail(job.data);
  }
}

const queue = new EmailQueue({ priority: "high" });
await queue.enqueue({ to: "user@example.com", subject: "Welcome" });
```

Priority levels: `critical`, `high`, `normal`, `low`.

#### 4. `BaseCompositeService` — Service Orchestration

Orchestrate multiple services with parallel execution, health checks, and metrics tracking.

```typescript
import { BaseCompositeService } from "@damatjs/services";

export class CheckoutService extends BaseCompositeService {
  async checkout(orderId: string) {
    const [payment, inventory] = await this.executeAll([
      this.safeExecute(() => paymentService.charge(orderId)),
      this.safeExecute(() => inventoryService.reserve(orderId)),
    ]);
    return { payment, inventory };
  }
}
```

#### 5. `BaseAggregatorService` — Data Aggregation

Aggregate data from multiple sources with partial failure tolerance.

#### 6. Link Definitions — Cross-Module Relationships

Define many-to-many or one-to-many relationships between modules without coupling them.

```typescript
import { defineLink } from "@damatjs/services";
import UserModule from "../user";
import TeamModule from "../team";

export const UserTeamLink = defineLink({
  from: { module: "user", entity: "User", field: "id" },
  to: { module: "team", entity: "Team", field: "id" },
  type: "many-to-many",
  table: "user_teams",
});
```

### Workflow Engine

The workflow engine implements the **saga pattern** — multi-step operations with automatic compensation (rollback) on failure. Built on [Effect-TS](https://effect.website) for composable, type-safe async effects.

```typescript
import {
  createStep,
  createWorkflow,
  parallel,
  RetryPolicies,
} from "@damatjs/workflow-engine";

// Define individual steps with optional compensation
const createTeamStep = createStep(
  "create-team",
  async (input: CreateTeamInput) => {
    const team = await teamService.create(input);
    return { teamId: team.id };
  },
  // Compensation: runs on failure to roll back
  async (output) => {
    await teamService.delete(output.teamId);
  },
  { retry: RetryPolicies.standard },
);

const assignOwnerStep = createStep(
  "assign-owner",
  async ({ teamId, userId }) => {
    await memberService.create({ teamId, userId, role: "owner" });
  },
);

// Compose into a workflow
export const createTeamWorkflow = createWorkflow(
  "create-team",
  async (input: CreateTeamInput) => {
    const { teamId } = await createTeamStep(input);
    await assignOwnerStep({ teamId, userId: input.ownerId });
    return { teamId };
  },
  { timeout: 30_000 },
);

// Execute
const result = await createTeamWorkflow.run({
  name: "My Team",
  ownerId: "user_1",
});
```

Built-in retry policies: `none`, `once`, `standard` (3 attempts, exponential backoff), `aggressive`, `patient`.

Parallel steps and conditional execution:

```typescript
import { parallel, when, ifElse } from "@damatjs/workflow-engine";

// Run two steps concurrently
await parallel(
  sendWelcomeEmailStep({ userId }),
  createDefaultProjectStep({ userId }),
);

// Conditional step
await when(input.plan === "pro", setupProFeaturesStep, { userId }, ctx, {
  skipped: true,
});
```

Distributed locking via Redis prevents concurrent execution of the same workflow instance:

```typescript
import { initWorkflowLock } from "@damatjs/workflow-engine";
import { createRedis } from "@damatjs/utils";

const redis = createRedis({ url: process.env.REDIS_URL });
initWorkflowLock(redis);
```

---

## The Default Backend (`@damatjs/default`)

The `backend/default` package is a fully configured, production-ready backend application that wires everything together. It demonstrates the full capabilities of the framework.

### Features

| Feature         | Implementation                                                     |
| --------------- | ------------------------------------------------------------------ |
| HTTP server     | Hono with file-based routing                                       |
| Authentication  | Better Auth (sessions, email/password, Google OAuth, GitHub OAuth) |
| Multi-tenancy   | Teams with 5 role levels (owner, admin, billing, member, viewer)   |
| API keys        | Scoped, hashed, rate-limited, usage-logged                         |
| Billing         | Stripe subscriptions + one-time credit purchases                   |
| Background jobs | Redis-backed queue                                                 |
| Webhooks        | HMAC-SHA256 signed, retry with exponential backoff                 |
| Rate limiting   | Sliding window via Redis, per-plan defaults                        |
| Vector search   | pgvector + OpenAI embeddings                                       |
| Caching         | Redis with TTL, cache-aside pattern                                |
| Migrations      | Per-module migration tracking                                      |
| Logging         | Structured JSON / pretty-print                                     |
| Docker          | Dockerfile + docker-compose (PostgreSQL pgvector, Redis, Adminer)  |

### API Routes

| Method     | Endpoint                                   | Description                          |
| ---------- | ------------------------------------------ | ------------------------------------ |
| `GET`      | `/health`                                  | Health check with DB + Redis latency |
| `POST`     | `/api/v1/auth/login`                       | Session login                        |
| `POST`     | `/api/v1/auth/register`                    | Register new user                    |
| `GET`      | `/api/v1/teams`                            | List teams for current user          |
| `POST`     | `/api/v1/teams`                            | Create a team (saga workflow)        |
| `POST`     | `/api/v1/teams/:teamId/members/invite`     | Invite a team member                 |
| `POST`     | `/api/v1/teams/invitations/accept`         | Accept a team invitation             |
| `POST`     | `/api/v1/api-keys/:teamId`                 | Create an API key                    |
| `GET`      | `/api/v1/api-keys/:teamId`                 | List API keys for a team             |
| `DELETE`   | `/api/v1/api-keys/:keyId`                  | Revoke an API key                    |
| `POST`     | `/api/v1/billing/:teamId/subscribe`        | Start a Stripe subscription          |
| `POST`     | `/api/v1/billing/:teamId/purchase-credits` | Buy one-time credits                 |
| `POST`     | `/api/v1/billing/webhook`                  | Stripe webhook receiver              |
| `GET/POST` | `/api/v1/webhooks`                         | Manage outbound webhooks             |
| `GET/POST` | `/api/v1/sections/*`                       | Content/embedding/search API         |

**Authentication**: Session cookie (browser) or `Authorization: Bearer <api-key>` / `X-API-Key: <api-key>` header.

### Team Roles

| Role      | Permissions                        |
| --------- | ---------------------------------- |
| `owner`   | Full access, billing, delete team  |
| `admin`   | Manage members, API keys, webhooks |
| `billing` | Manage subscriptions and credits   |
| `member`  | Read/write access                  |
| `viewer`  | Read-only access                   |

### Billing Plans

| Plan       | Rate Limit  | Features         |
| ---------- | ----------- | ---------------- |
| Free       | 60 req/min  | Basic access     |
| Starter    | 120 req/min | Increased limits |
| Pro        | 300 req/min | Priority support |
| Enterprise | Custom      | Unlimited        |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.1.0
- PostgreSQL 15+ with [pgvector](https://github.com/pgvector/pgvector) extension (or Docker)
- Redis 7+

### 1. Install dependencies

```bash
bun install
```

### 2. Build all packages

```bash
bun run build
# or
turbo build
```

### 3. Start the default backend

```bash
cd backend/default

# Copy and configure environment variables
cp .env.example .env

# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d db redis

# Run database migrations
bun run db:migrate

# Start the development server
bun run dev
```

The server starts at `http://localhost:3000`.

### 4. Or scaffold a new project

```bash
npx create-damat-app@latest
```

Follow the interactive prompts to configure your new project.

CLI options:

```bash
--module            Scaffold a new module in an existing project
--repo-url <url>    Use a custom starter repository
--version <ver>     Pin a specific package version
--directory-path    Target installation directory
--use-bun           Use Bun as the package manager
--verbose           Enable verbose output
```

---

## Environment Variables

| Variable                | Required | Description                                   |
| ----------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`          | Yes      | PostgreSQL connection string                  |
| `REDIS_URL`             | No       | Redis URL (default: `redis://localhost:6379`) |
| `BETTER_AUTH_SECRET`    | Yes      | Auth signing secret (min 32 chars)            |
| `JWT_SECRET`            | Yes      | JWT signing key                               |
| `COOKIE_SECRET`         | Yes      | Cookie signing key                            |
| `STRIPE_SECRET_KEY`     | No       | Stripe API key                                |
| `STRIPE_WEBHOOK_SECRET` | No       | Stripe webhook signing secret                 |
| `OPENAI_API_KEY`        | No       | OpenAI API key (for vector search)            |
| `GOOGLE_CLIENT_ID`      | No       | Google OAuth client ID                        |
| `GOOGLE_CLIENT_SECRET`  | No       | Google OAuth client secret                    |
| `GITHUB_CLIENT_ID`      | No       | GitHub OAuth client ID                        |
| `GITHUB_CLIENT_SECRET`  | No       | GitHub OAuth client secret                    |
| `CORS_ORIGIN`           | No       | Comma-separated allowed origins               |
| `PORT`                  | No       | Server port (default: `3000`)                 |
| `NODE_ENV`              | No       | `development` or `production`                 |
| `LOG_LEVEL`             | No       | `debug`, `info`, `warn`, or `error`           |
| `LOG_FORMAT`            | No       | `json` or `pretty`                            |

See `backend/default/.env.example` for a complete list with descriptions.

---

## Database Migrations

Damat uses a per-module migration system. Each module owns its own `migrations/` folder. A central `_module_migrations` table tracks which migrations have run per module.

```bash
# Run all pending migrations
bun run db:migrate

# Check migration status across all modules
bun run db:migrate status

# Create a new migration for a module
bun run db:migrate create <module> <MigrationName>

# Revert the last migration for a module
bun run db:migrate revert <module>

# Revert the last N migrations for a module
bun run db:migrate revert <module> <count>

# List all modules with registered migrations
bun run db:migrate list
```

---

## Development

### Run all packages in watch mode

```bash
bun run dev
# or
turbo dev
```

### Run tests

```bash
# All packages
bun test

# Backend default only
cd backend/default && bun run test
```

### Lint and type check

```bash
turbo lint
turbo check-types
```

### Docker

```bash
# Start all infrastructure services
docker-compose up -d

# Build and run the API container
docker build -t damatjs/api .
docker-compose up api

# View logs
docker-compose logs -f api
```

---

## Tech Stack

| Category       | Technology                                     |
| -------------- | ---------------------------------------------- |
| Runtime        | [Bun](https://bun.sh) 1.3.9                    |
| Language       | TypeScript 5.9                                 |
| HTTP Framework | [Hono](https://hono.dev) 4.x                   |
| ORM            | A Custom damat-orm under Development           |
| Database       | PostgreSQL 17 + pgvector                       |
| Cache / Queues | Redis 7 (via ioredis)                          |
| Auth           | [Better Auth](https://www.better-auth.com) 1.x |
| Workflows      | [Effect-TS](https://effect.website) 3.x        |
| Validation     | [Zod](https://zod.dev) 4.x                     |
| Monorepo       | [Turborepo](https://turborepo.dev)             |
| Build          | tsup / tsc                                     |

---

## Packages

| Package                      | Description                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| `@damatjs/framework`         | Core framework primitives                                              |
| `@damatjs/types`             | Shared TypeScript type definitions                                     |
| `@damatjs/services`          | Base service classes (CRUD, HTTP, queue, composite, aggregator, links) |
| `@damatjs/orm-model`         | Fluent model/schema DSL                                                |
| `@damatjs/orm-connector`     | Database connection management                                         |
| `@damatjs/orm-migration`     | Module-based migration runner and CLI                                  |
| `@damatjs/orm-pg`            | Low-level PostgreSQL execution layer                                   |
| `@damatjs/orm-processor`     | Schema and model processor                                             |
| `@damatjs/utils`             | Logger, config, Redis utils, file-based router, env loader             |
| `@damatjs/workflow-engine`   | Saga workflow orchestration with Effect-TS                             |
| `@damatjs/deps`              | All external dependencies re-exported for consistent versioning        |
| `@damatjs/create-damat-app`  | Project scaffolding CLI                                                |
| `@damatjs/typescript-config` | Shared `tsconfig.json` presets                                         |

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Author

Built by [Abel Lamesgen](https://github.com/damatjs).
