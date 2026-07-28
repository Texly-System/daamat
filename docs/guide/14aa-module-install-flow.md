[Damat Guide](../GUIDE.md) › Installing modules

# 14.1 Plan and integrate a module install

## Understand capability destinations

A module declares `install.provides`; the application declares
`install.accepts`. Each capability destination is selected in this order:

1. An explicit CLI `--target capability=path` override.
2. The application's matching `accepts` destination.
3. The module's safe `fallbackTo` destination.
4. A planning error when none exists.

`{id}` in a destination is replaced by the installation identity.
For conventional modules, routes, workflows, jobs, events, pipelines, and links
land in their matching top-level backend roots under an `<id>` directory. The
remaining implementation lands in `src/modules/<id>`. Narrow capability source
patterns take precedence over a broad `src/**` module pattern.

## Plan before writing

```bash
damat module plan ./modules/user
damat module add ./modules/user
```

Review every destination and integration notice. Do not bypass rejected or
revoked artifacts. Direct paths and Git origins may require an explicit
unverified-source decision because no registry verification is available.
Plan output lists each capability in stable order with its provider source,
resolved override/receiver/fallback destination, and operation count.
For local paths, the source module's `.git` and `node_modules` directories stay
untouched and are not scanned or copied into the backend. Ignored or unmapped
symlinks do not block the plan, while a symlink selected for installation is
rejected and no symlink is followed.

## Understand `damat.lock.json`

The installer writes `damat.lock.json` last after a successful transaction. It
records where each artifact came from, its integrity and verification state,
and the checksums of every file and package the installer owns. Later plan,
update, and remove commands use it to detect collisions, local modifications,
and exact ownership.

It is not Bun's dependency lockfile and does not make a module executable. It
does not edit runtime registration, aliases, environment values, capability
imports, workers, or database state; those remain explicit backend integration
work.

## Complete host-owned wiring

The installer deliberately does not edit shared application policy:

- `damat.config.ts` module and provider bindings;
- TypeScript aliases;
- `.env` and `.env.example`;
- shared barrels and capability imports;
- application call sites or operational routes.

After installation:

1. Register the module and any provider role.
2. Import its jobs, events, or pipelines before bootstrap when required.
3. Add reviewed environment values.
4. Enable matching services and worker types.
5. Run `bun run db:migrate`.
6. Restart and verify the installed capability.

---

Prev: [← Installing a module](./14-installing-modules.md) · [Guide home](../GUIDE.md) · Next: [Module lifecycle →](./14ab-module-package-lifecycle.md)
