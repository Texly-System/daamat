[Damat Guide](../GUIDE.md) › Module capabilities

# 16. Read a module's capabilities

`damat.json` is the module's portable, declarative contract. It describes
identity, installable files, runtime paths, environment requirements, and
integration guidance without executing module-authored code.

## Minimal shape

```jsonc
{
  "schemaVersion": 1,
  "kind": "module",
  "name": "inventory",
  "install": {
    "provides": {
      "module": {
        "from": "src/**",
        "fallbackTo": "src/modules/{id}"
      },
      "jobs": {
        "from": "src/jobs/**",
        "fallbackTo": "src/jobs/{id}"
      }
    }
  },
  "module": {
    "models": "./src/models",
    "migrations": "./src/migrations",
    "jobs": "./src/jobs",
    "env": []
  }
}
```

`install.provides` controls file mapping during installation. The `module`
object tells standalone and assembled runtimes where each capability lives.
Unknown manifest fields are rejected so misspellings cannot silently change an
install plan.

## Ownership rule

A module may provide models, migrations, routes, workflows, jobs, events,
pipelines, dormant link templates, tests, and generated types. It must not
choose host queues, workers, concurrency, retention, Redis, authentication, or
deployment policy.

Relations stay inside the module's own tables. Cross-module relationships are
app-owned links.

---

Prev: [← Installing modules with AI](./15-installing-modules-with-ai.md) · [Guide home](../GUIDE.md) · Next: [Durable module capabilities →](./16b-provider-capabilities.md)
