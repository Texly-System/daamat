import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getModuleMigrationStatus } from "../executor/status";
import { container } from "./executor.container.fixture";
import { makeFakePool, makeModule } from "./executor.test.fixture";

let tmpRoot = "";
let moduleCounter = 0;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(os.tmpdir() + "/orm-mig-status-module-");
});
afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe("getModuleMigrationStatus", () => {
  it("getModuleMigrationStatus throws when a module has no migrations", async () => {
    const emptyDir = path.join(tmpRoot, "no-migs");
    fs.mkdirSync(emptyDir, { recursive: true });
    const fake = makeFakePool();
    await expect(
      getModuleMigrationStatus(
        fake.pool,
        container([{ dir: emptyDir, name: "empty" }]).empty as any,
      ),
    ).rejects.toThrow("Module 'empty' not found or has no migrations");
  });

  it("getModuleMigrationStatus reports a single module's status", async () => {
    const mod = makeModule(tmpRoot, moduleCounter++, [
      { name: "Migration20260101000000_Initial" },
      { name: "Migration20260201000000_AddEmail" },
    ]);
    const fake = makeFakePool({
      applied: {
        [mod.name]: [
          {
            module: mod.name,
            name: "Migration20260201000000_AddEmail",
            applied_at: new Date(),
          },
        ],
      },
    });
    const result = await getModuleMigrationStatus(
      fake.pool,
      container([mod])[mod.name] as any,
    );
    expect(result.module.name).toBe(mod.name);
    expect(result.module.applied).toBe(1);
    expect(result.module.pending).toBe(1);
    expect(result.module.migrations).toHaveLength(2);
  });
});
