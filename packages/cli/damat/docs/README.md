# Damat CLI composer internals

`src/capabilities.ts` composes the app, codegen, module, kit, and auth
capabilities. `src/cli.ts` passes that ordered command list to `runCli`.
`src/runtime.ts` is the only Damat-specific runtime adapter: it reads process
state, creates the logger, and writes output to the console.

The composer must not import framework, module, codegen-core, link, environment,
or ORM implementation packages. Those dependencies belong to the capability
that owns the command.

The composed command definitions retain repeatable installer `--target`
options for module and Kit plans and installs.

Compatibility tests assert command order, representative aliases/options, help
composition, runtime defaults, and console output.
The core runtime consumes enabled global options before capability dispatch, so
the composer accepts `--verbose` before or after nested module commands and
passes it to their handled-error reports. Verbose failures contain one command
summary and one stack rather than a duplicate error heading.
Composed help exposes `--no-git` for both `create` and `module init`; each
command initializes Git on `main` by default and keeps Git opt-out independent
from dependency installation and database setup.
Standalone module process regressions keep their lifecycle probes local to the
test fixture so a clean install does not depend on undeclared implementation
packages. Shutdown coverage uses a controlling PTY and writes an actual Ctrl-C
character, then checks worker stop records and immediate port reuse.
