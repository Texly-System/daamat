[Damat Guide](../GUIDE.md) › Module testing and publishing

# 13.2 Test and prepare a module for publishing

Test a module through its real manifest, pool, and migration path. The harness
boots only the module and the local catalogs required by its declared durable
capabilities.

```ts
import { withModule } from "@damatjs/module";
import inventory from "../src";

await withModule(inventory, { moduleDir }, async ({ service }) => {
  const item = await service.items.create({ data: { name: "A" } });
  expect(item.name).toBe("A");
});
```

The harness creates one pool, applies migrations, initializes the service, and
guarantees teardown even when an assertion fails. Declared jobs, durable events,
and pipelines receive a durability client automatically; pipeline definitions
are synchronized after module initialization. Sequential harness lifecycles
restore any prior process-global durability client during teardown.

## Run the module gates

```bash
bun run codegen
bun run typecheck
bun test
bun run build
bun run validate
```

Review validation warnings as well as errors. Confirm generated files are
current, the manifest paths exist, and every declared capability can load.

## Write useful installation guidance

`damat.json` is the portable contract. Keep `install.instructions` specific
about the host work that cannot be automated:

- module registration and provider binding;
- required environment variables;
- capability imports and service enablement;
- migrations and restart order;
- authenticated operational routes, if needed.

The installer owns copied files and provenance. The backend owner keeps control
of shared config and runtime policy.

---

Prev: [← Service and layering](./13b-module-service-and-layering.md) · [Guide home](../GUIDE.md) · Next: [Installing modules →](./14-installing-modules.md)
