[Damat Guide](../GUIDE.md) › Troubleshooting tooling

# 21.2 Tooling and build faults

## A module source cannot be resolved

Set `DAMAT_REGISTRY` or its `DAMAT_MODULE_REGISTRY` compatibility alias for
registry references. A local path or Git URL does not need a registry index.

```bash
damat module plan <source>
```

Review the resolved origin, integrity, trust status, destinations, and notices.
Rejected and revoked artifacts cannot be bypassed.

## MCP cannot start Damat

Put the `damat` binary on `PATH` or set `DAMAT_CLI` in `.mcp.json`. Also confirm
the configured application directory and registry environment.

## A standalone module does not start

For a database-backed module, confirm `.env` contains `DATABASE_URL`. Run with
verbose diagnostics on either side of the nested command:

```bash
damat --verbose module dev
damat module dev --verbose
```

An occupied fixed port fails with a port hint. Use `damat module dev --port 0`
for an ephemeral port. Source reload must finish old HTTP and worker shutdown
before starting the replacement.

## Monorepo tests interfere with each other

Use the repository scripts:

```bash
bun run build
bun run test
```

Do not run plain `bun test` at the repository root. The root runner isolates
package mocks and provisions independent PostgreSQL databases.

## TypeScript or `pg-cloudflare` resolution fails

Application builds use the project's installed TypeScript compiler. Keep the
coordinated Damat tooling packages aligned and ensure `typescript` is installed
in the target project.

Application migration and codegen loading keeps optional `pg-cloudflare`
external. Do not add it as a direct dependency solely to make config loading or
codegen work.

Repository rules and package ownership are documented in
[AGENTS.md](../../AGENTS.md). Package internals live in each package's `docs/`
folder.

---

Prev: [← Runtime and durability faults](./21b-troubleshooting-runtime.md) · [Guide home](../GUIDE.md)
