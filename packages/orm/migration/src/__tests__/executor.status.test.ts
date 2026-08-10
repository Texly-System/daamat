import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";

import { getMigrationStatus } from "../executor/status";
import { container } from "./executor.container.fixture";
import { makeFakePool, makeModule } from "./executor.test.fixture";

let tmpRoot = "";
let moduleCounter = 0;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-status-");
});
afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe("getMigrationStatus", () => {
  it("reports applied vs pending counts per module", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_Initial" },
      { name: "Migration20260201000000_AddEmail" },
    ]);
    const fake = makeFakePool({
      applied: {
        [mod.name]: [
          {
            module: mod.name,
            name: "Migration20260101000000_Initial",
            applied_at: new Date(),
          },
        ],
      },
    });
    const status = await getMigrationStatus(fake.pool, container([mod]) as any);
    expect(status.modules).toHaveLength(1);
    const result = status.modules[0]!;
    expect(result.name).toBe(mod.name);
    expect(result.applied).toBe(1);
    expect(result.pending).toBe(1);
    const initial = result.migrations.find((migration) =>
      migration.name.endsWith("_Initial"),
    );
    const email = result.migrations.find((migration) =>
      migration.name.endsWith("_AddEmail"),
    );
    expect(initial!.applied).toBe(true);
    expect(email!.applied).toBe(false);
  });

  it("reports all-pending when nothing is applied", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_Initial" },
    ]);
    const status = await getMigrationStatus(
      makeFakePool().pool,
      container([mod]) as any,
    );
    expect(status.modules[0]!.applied).toBe(0);
    expect(status.modules[0]!.pending).toBe(1);
  });
});
