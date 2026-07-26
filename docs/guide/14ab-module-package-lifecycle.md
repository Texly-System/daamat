[Damat Guide](../GUIDE.md) › Installing modules

# 14.2 Source mode, package mode, and lifecycle

## Choose an install mode

- **Source mode** copies editable capability files into the application. It is
  the normal composition and development path.
- **Package mode** installs an immutable Node or Damat package reference. It
  requires the explicit experimental gate and a manifest that supports the
  selected backend.

```bash
damat module add npm:@acme/user@1.0.0 \
  --mode package \
  --package-backend node \
  --experimental-package
```

Both modes use the same module identity, capability destinations, security
policy, and lockfile ownership records.

## Understand trust

- Registry installs retain namespace, owner, integrity, and verification data.
- Rejected or revoked registry artifacts are always blocked.
- Direct origins retain provenance but may be unverified.
- Dependency scripts remain disabled unless explicitly allowed.

## Update safely

```bash
damat module update user --dry-run
damat module update user --yes
```

The dry run shows changed, removed, and locally modified owned files. Confirm
before overwriting local edits; backups are created only for modified managed
files that an approved update replaces.

## Remove safely

```bash
damat module remove user --dry-run
damat module remove user --yes
```

Removal deletes installer-owned files and reports possible usage outside those
files. You remain responsible for shared config, aliases, environment values,
barrels, migrations already applied to the database, and application call sites.

---

Prev: [← Plan and integrate an install](./14aa-module-install-flow.md) · [Guide home](../GUIDE.md) · Next: [Publishing modules →](./14b-publishing-modules.md)
