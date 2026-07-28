# @damatjs/installer

## 1.0.5

### Patch Changes

- Fix local module installation from normal Bun development workspaces. Source
  planning now prunes dependency, repository, ignored, and unmapped subtrees
  before symlink validation while continuing to reject selected artifact
  symlinks. Capability mappings are ordered most-specific-first, and module
  routes, workflows, jobs, events, pipelines, links, and tests again install into
  their backend-owned roots.

## 1.0.4

### Patch Changes

- Harden intent idempotency, migration integrity, sensitive logging, HTTP and CLI contracts, module lifecycle behavior, exact numeric codegen, and install-plan observability.

## 1.0.3

## 1.0.2

### Patch Changes

- Fixed
  - Real terminal Ctrl-C now drains workers and records stopping_at/stopped_at.
  - MCP bare names resolve unique namespaced modules and report ambiguity.
  - Global --verbose works before or after module commands and exposes stack traces.
  - Fixed the Bun/Playwright compatibility issue

## 1.0.1

### Patch Changes

- bug fixes and small patches

## 1.0.0

### Major Changes

- 8011ac8: Prepare Damat's early-launch beta: the shared package line graduates to the v1
  contract around composable modules, PostgreSQL-canonical durable execution,
  optional Redis acceleration, split CLI capabilities, transactional installs,
  ModuleService-based provider standards, and production deployment gates.

## 1.0.0-beta.0

### Major Changes

- Prepare Damat's early-launch beta: the shared package line graduates to the v1
  contract around composable modules, PostgreSQL-canonical durable execution,
  optional Redis acceleration, split CLI capabilities, transactional installs,
  standardized provider capabilities, and production deployment gates.
