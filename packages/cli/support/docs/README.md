# CLI support internals

| Area                    | Responsibility                                                    |
| ----------------------- | ----------------------------------------------------------------- |
| `cleanupTempFile.ts`    | Best-effort removal with debug diagnostics.                       |
| `database/`             | PostgreSQL options, hidden prompts, URL building, and selection.  |
| `git.ts`                | Detect Git and initialize scaffold repositories safely.             |
| `gitSource.ts`          | Parse Git URLs and GitHub source shorthand.                       |
| `runTypeCheck.ts`       | Run local `bun run tsc --noEmit` from the target project.         |
| `packages/validate.ts`  | Validate package names and ranges.                                |
| `packages/install.ts`   | Build safe `bun add` arguments and return output.                 |
| `installer/origin.ts`   | Parse paths, Git, registry, npm, and tarball arguments.           |
| `installer/registry.ts` | Resolve configured registry indexes to trusted origins.           |
| `installer/runtime.ts`  | Adapt CLI logging, flags, commands, and fetch to installer ports. |
| `installer/options.ts`  | Parse mode, backend, and capability destination overrides.        |

The package is a leaf above `@damatjs/cli`. App, kit, and module capabilities
may depend on it, but it never imports those packages or the composer.
`initializeGit` probes the system executable, creates a `main` branch, stages
the completed scaffold, and makes one initial commit. Git failures only warn;
callers keep the scaffold and can use `--no-git` to skip the probe entirely.
The type-check helper inherits output and exit status, skips missing
`tsconfig.json` files, and never asks Bun to resolve or download a registry
package.

Installer option adaptation accepts a scalar target or an ordered repeatable
target array, maps each `capability=path` entry, and keeps the last path when a
capability is supplied more than once.
