import { afterEach, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadSystemMigrations } from "../cli/utils/load";
import {
  eventSystemMigrations,
  jobEventSystemMigrations,
  jobSystemMigrations,
} from "./systemMigrationExpectations";

const roots: string[] = [];

afterEach(() => {
  roots
    .splice(0)
    .forEach((root) => fs.rmSync(root, { recursive: true, force: true }));
});

async function load(services: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "system-catalog-"));
  roots.push(root);
  fs.writeFileSync(
    path.join(root, "damat.config.ts"),
    `export default { services: { ${services} } }`,
  );
  return loadSystemMigrations("damat.config.ts", root);
}

test("selects shared then jobs migrations when jobs are enabled", async () => {
  expect(
    (await load("jobs: {}")).map(({ owner, id }) => `${owner}:${id}`),
  ).toEqual(jobSystemMigrations);
});

test("selects shared then events migrations for durable events", async () => {
  expect(
    (await load("events: { durable: {} }")).map(
      ({ owner, id }) => `${owner}:${id}`,
    ),
  ).toEqual(eventSystemMigrations);
});

test("orders shared, jobs, then events catalogs", async () => {
  expect(
    (await load("jobs: {}, events: { durable: {} }")).map(({ owner }) => owner),
  ).toEqual(jobEventSystemMigrations.map((key) => key.split(":")[0]));
});

test("does not select shared migrations for ordinary events", async () => {
  expect(await load("events: { broadcast: true }")).toEqual([]);
});

test("wraps system catalog config failures with the config path", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "system-catalog-error-"));
  roots.push(root);
  fs.writeFileSync(
    path.join(root, "damat.config.ts"),
    `export default { get services() { throw new Error("catalog boom") } }`,
  );
  await expect(loadSystemMigrations("damat.config.ts", root)).rejects.toThrow(
    /Failed to load system migrations.*damat\.config\.ts/,
  );
});
