import { expect, test } from "bun:test";
import {
  context,
  loadAdopt,
  logged,
  setupMigrateFixture,
  state,
  USER,
  writeConfig,
} from "./fixture";

setupMigrateFixture();

const options = {
  checksum: "a".repeat(64),
  actor: "release-bot",
  reason: "concurrent index committed",
};

test.serial("adopt requires module and migration names", async () => {
  const { ctx, calls } = context([], options);
  expect((await (await loadAdopt()).handler(ctx)).exitCode).toBe(1);
  expect(logged(calls, "error", /Module and migration names/)).toBe(true);
});

test.serial("adopt records an audited migration and closes the pool", async () => {
  writeConfig({ modules: { user: USER } });
  const { ctx, calls } = context(["user", "Migration1_Index"], options);
  expect((await (await loadAdopt()).handler(ctx)).exitCode).toBe(0);
  expect(state.adoptArgs?.[1]).toMatchObject({ name: "user", resolve: USER });
  expect(state.adoptArgs?.[2]).toBe("Migration1_Index");
  expect(state.adoptArgs?.[3]).toEqual(options);
  expect(state.ends).toBe(1);
  expect(logged(calls, "success", /Adopted user\/Migration1_Index/)).toBe(true);
});

test.serial("adopt reports config and adoption failures", async () => {
  writeConfig({ modules: {} });
  let value = context(["missing", "Migration1_Index"], options);
  expect((await (await loadAdopt()).handler(value.ctx)).exitCode).toBe(1);
  expect(logged(value.calls, "error", /Module 'missing' not found/)).toBe(true);

  writeConfig({ modules: { user: USER } });
  state.adoptError = new Error("already applied");
  value = context(["user", "Migration1_Index"], options);
  expect((await (await loadAdopt()).handler(value.ctx)).exitCode).toBe(1);
  expect(logged(value.calls, "error", /already applied/)).toBe(true);
  expect(state.ends).toBe(1);
});
