# Create damat App - Codebase Memory

> This document provides comprehensive insights for AI agents working with this codebase.

## Overview

`create-damat-app` is a CLI tool for bootstrapping damat e-commerce projects and modules. It has been modernized to use **Bun** as the primary runtime and package manager, removing legacy dependencies and simplifying the setup flow.

## Architecture

### Entry Point Flow

```
npx create-damat-app [project-name] [options]
         |
         v
    src/index.ts (CLI argument parsing with cac)
         |
         v
    src/commands/create.ts (delegates to factory)
         |
         v
    src/utils/projectCreator/projectCreatorFactory.ts
    ├── Validates Bun version (>=1.0.0)
    └── Prompts for project name if needed
         |
         ├── --module flag --> damatModuleCreator
         |                          |
         |                          v
         |                    Clone module repo
         |                    Prepare module (update package.json)
         |                    Install dependencies
         |                    Show success message
         |
         └── (default) --> damatProjectCreator
                                  |
                                  v
                        1. Clone damat starter repo
                        2. Prepare project (update package.json, create .env)
                        3. Install dependencies
                        4. Start damat server
                        5. Open browser (handled by server start)
```

### Directory Structure

```
src/
├── index.ts                    # CLI entry point (uses cac)
├── types.d.ts                  # Type declarations
├── commands/
│   └── create.ts               # Create command handler
└── utils/
    ├── actions/
    │   ├── cloneRepo.ts        # Git clone utilities
    │   ├── prepareProject.ts   # Project/Module preparation logic
    │   └── ...
    ├── commands/
    │   ├── createAbortController.ts
    │   ├── executor.ts         # Shell command execution
    │   ├── facts.ts            # damat tips display
    │   ├── manager.ts          # Process lifecycle management
    │   └── startdamat.ts      # damat server starter
    ├── database/
    │   ├── create.ts           # Database creation logic
    │   ├── formatConnectionString.ts
    │   └── postgresClient.ts
    ├── gets/
    │   ├── bunVersion.ts       # Bun version validation
    │   ├── configStore.ts      # Persistent config store
    │   └── CurrentOs.ts        # OS detection
    ├── logger/
    │   ├── index.ts
    │   └── message.ts          # Styled logging
    ├── package/
    │   ├── manager.ts          # Package manager abstraction
    │   └── versionsUpdater.ts  # Dependency version updater
    └── projectCreator/
        ├── index.ts
        ├── creator.ts          # Base abstract class & interfaces
        ├── projectCreatorFactory.ts # Factory pattern impl
        ├── damatProjectCreator.ts  # Full project creator
        └── damatModuleCreator.ts   # Module creator
```

## Key Dependencies

| Package          | Purpose                  | Usage Pattern                                                     |
| ---------------- | ------------------------ | ----------------------------------------------------------------- |
| `bun`            | Runtime & Pkg Manager    | Used for all scripts, testing, and runtime execution              |
| `picocolors`     | Terminal coloring        | `import pc from "picocolors"` then `pc.green()`, `pc.red()`, etc. |
| `@clack/prompts` | Interactive prompts      | `import * as p from "@clack/prompts"` for text, confirm, select   |
| `yocto-spinner`  | Spinner animations       | `import { createSpinner } from "yocto-spinner"`                   |
| `cac`            | CLI argument parsing     | `import cac from "cac"` with `.option()` and `.parse()`           |
| `boxen`          | Styled terminal boxes    | Used for success messages and tips                                |

## Design Patterns

### Factory Pattern

`ProjectCreatorFactory` in `src/utils/projectCreator` determines whether to create a full project (`damatProjectCreator`) or a module (`damatModuleCreator`) based on CLI flags.

### Template Method Pattern

`BaseProjectCreator` (in `src/utils/projectCreator/creator.ts`) defines the skeleton for creation flows, extending into specific implementations.

## Important Implementation Details

### Bun Integration

The tool explicitly checks for and requires **Bun** (via `src/utils/gets/bunVersion.ts`). It uses `bun install`, `bun run`, and `bun test`.

### Project Preparation (`prepareProject.ts`)

This action handles:
1. Updating `package.json` with the new project name and version.
2. Generating `.env` file with default configurations.
3. Installing dependencies using Bun.

### Environment Variables Created

Projects are bootstrapped with these `.env` variables:

- `FRONTEND_CORS`: Includes localhost ports (8000, 5173, 9000) and docs url.
- `AUTH_CORS`: Matches `FRONTEND_CORS`.
- `REDIS_URL`: Defaults to `redis://localhost:6379`.
- `JWT_SECRET`, `COOKIE_SECRET`: Default "supersecret".

## Testing

Tests use **Bun's built-in test runner**:

```bash
bun test                    # Run all tests
```

Test files use Bun's testing API (`bun:test`):

```typescript
import { describe, it, expect } from "bun:test";
```

## Gotchas

1. **Bun Requirement**: Must have Bun >= v1.0.0 installed.
2. **Project Names**: Cannot contain dots (`.`) due to MikroORM path resolution issues.
3. **ESM Helper**: The project is strict ESM (`"type": "module"`).
4. **No Next.js Starter**: The integrated Next.js starter setup has been removed.
5. **Database**: Database creation logic exists but automatic seeding flow has been simplified.

## Build & Run

```bash
bun run dev        # Development mode
bun run build      # Compile TypeScript (targets Bun)
bun run start      # Run compiled version
bun test           # Run tests
```
