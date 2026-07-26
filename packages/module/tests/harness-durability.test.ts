import { afterEach, expect, mock, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  clearDurabilityClient,
  createDurabilityClient,
  getDurabilityClientOrUndefined,
  setDurabilityClient,
} from "@damatjs/durability";

const answer = async () => ({ rows: [], rowCount: 0 });
const client = { query: answer, release() {} };
const pool = { query: answer, connect: async () => client } as never;
const disconnect = mock(async () => {});
const connectorPath = Bun.resolveSync("@damatjs/orm-connector", import.meta.dir);
const realConnector = await import(connectorPath);

mock.module("@damatjs/orm-connector", () => ({
  ...realConnector,
  ConnectionManager: class {
    connect = async () => pool;
    disconnect = disconnect;
  },
}));

const { bootModule } = await import("../src/harness/boot");
let root: string | undefined;

function moduleDirectory(): string {
  root = mkdtempSync(join(tmpdir(), "damat-harness-durable-"));
  const src = join(root, "src");
  mkdirSync(join(src, "jobs"), { recursive: true });
  writeFileSync(
    join(src, "module.json"),
    JSON.stringify({ name: "durable", version: "1.0.0" }),
  );
  return src;
}

afterEach(() => {
  clearDurabilityClient();
  if (root) rmSync(root, { recursive: true, force: true });
  root = undefined;
});

test("restores the prior durability client after teardown", async () => {
  const previous = createDurabilityClient({ pool });
  setDurabilityClient(previous);
  const booted = await bootModule(
    { name: "durable", service: {}, init() {} },
    { databaseUrl: "postgres://not-dialed", moduleDir: moduleDirectory() },
  );
  expect(getDurabilityClientOrUndefined()).not.toBe(previous);
  await Promise.all([booted.teardown(), booted.teardown()]);
  expect(getDurabilityClientOrUndefined()).toBe(previous);
});

test("clears harness durability when initialization fails", async () => {
  await expect(
    bootModule(
      {
        name: "durable",
        service: {},
        init() {
          throw new Error("init failed");
        },
      },
      { databaseUrl: "postgres://not-dialed", moduleDir: moduleDirectory() },
    ),
  ).rejects.toThrow("init failed");
  expect(getDurabilityClientOrUndefined()).toBeUndefined();
});
