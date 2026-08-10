# @damatjs/pipelines

## 1.0.6

### Patch Changes

- Restore environment-aware generated backends, align optional Git setup, preserve
  repeatable installer targets, harden heuristic provider resolution, and document
  the durable event-wait activation boundary.
- Move framework-owned PostgreSQL infrastructure into the dedicated `damat`
  schema with data-preserving forward migrations and fully qualified runtime SQL.
- Updated dependencies
- Updated dependencies
  - @damatjs/durability@1.0.6
  - @damatjs/events@1.0.6
  - @damatjs/jobs@1.0.6
  - @damatjs/deps@1.0.6
  - @damatjs/workflow-engine@1.0.6
  - @damatjs/logger@1.0.6

## 1.0.5

### Patch Changes

- @damatjs/deps@1.0.5
- @damatjs/durability@1.0.5
- @damatjs/events@1.0.5
- @damatjs/jobs@1.0.5
- @damatjs/logger@1.0.5
- @damatjs/workflow-engine@1.0.5

## 1.0.4

### Patch Changes

- Harden intent idempotency, migration integrity, sensitive logging, HTTP and CLI contracts, module lifecycle behavior, exact numeric codegen, and install-plan observability.
- Updated dependencies
  - @damatjs/durability@1.0.4
  - @damatjs/events@1.0.4
  - @damatjs/jobs@1.0.4
  - @damatjs/workflow-engine@1.0.4
  - @damatjs/deps@1.0.4
  - @damatjs/logger@1.0.4

## 1.0.3

### Patch Changes

- Updated dependencies
  - @damatjs/logger@1.0.3
  - @damatjs/events@1.0.3
  - @damatjs/jobs@1.0.3
  - @damatjs/workflow-engine@1.0.3
  - @damatjs/deps@1.0.3
  - @damatjs/durability@1.0.3

## 1.0.2

### Patch Changes

- Fixed
  - Real terminal Ctrl-C now drains workers and records stopping_at/stopped_at.
  - MCP bare names resolve unique namespaced modules and report ambiguity.
  - Global --verbose works before or after module commands and exposes stack traces.
  - Fixed the Bun/Playwright compatibility issue
- Updated dependencies
  - @damatjs/durability@1.0.2
  - @damatjs/events@1.0.2
  - @damatjs/jobs@1.0.2
  - @damatjs/logger@1.0.2
  - @damatjs/deps@1.0.2
  - @damatjs/workflow-engine@1.0.2

## 1.0.1

### Patch Changes

- bug fixes and small patches
- Updated dependencies
  - @damatjs/durability@1.0.1
  - @damatjs/events@1.0.1
  - @damatjs/jobs@1.0.1
  - @damatjs/logger@1.0.1
  - @damatjs/deps@1.0.1
  - @damatjs/workflow-engine@1.0.1

## 1.0.0

### Major Changes

- 8011ac8: Prepare Damat's early-launch beta: the shared package line graduates to the v1
  contract around composable modules, PostgreSQL-canonical durable execution,
  optional Redis acceleration, split CLI capabilities, transactional installs,
  ModuleService-based provider standards, and production deployment gates.

### Patch Changes

- Updated dependencies [8011ac8]
  - @damatjs/deps@1.0.0
  - @damatjs/durability@1.0.0
  - @damatjs/events@1.0.0
  - @damatjs/jobs@1.0.0
  - @damatjs/logger@1.0.0
  - @damatjs/workflow-engine@1.0.0

## 1.0.0-beta.0

### Major Changes

- Prepare Damat's early-launch beta: the shared package line graduates to the v1
  contract around composable modules, PostgreSQL-canonical durable execution,
  optional Redis acceleration, split CLI capabilities, transactional installs,
  standardized provider capabilities, and production deployment gates.

### Patch Changes

- Updated dependencies
  - @damatjs/deps@1.0.0-beta.0
  - @damatjs/durability@1.0.0-beta.0
  - @damatjs/events@1.0.0-beta.0
  - @damatjs/jobs@1.0.0-beta.0
  - @damatjs/logger@1.0.0-beta.0
  - @damatjs/workflow-engine@1.0.0-beta.0
