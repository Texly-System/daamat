import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveModuleArtifact } from "../../module";
import { write } from "./fixture";

const PROVIDERS = ["workflows", "jobs", "events", "pipelines"] as const;
const roots: string[] = [];
const temp = () => {
  const root = mkdtempSync(join(tmpdir(), "damat-provider-resolution-"));
  roots.push(root);
  return root;
};
afterEach(() =>
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true })),
);

function moduleRoot(cwd: string): string {
  const root = join(cwd, "src/modules/billing");
  write(root, "src/index.ts", "export default {};");
  return root;
}

test("ignores invalid application provider directories", () => {
  const cwd = temp();
  const root = moduleRoot(cwd);
  for (const name of PROVIDERS) {
    mkdirSync(join(cwd, "src", name, "billing"), { recursive: true });
    write(root, `${name}/index.ts`, "export {};");
  }
  const resolved = resolveModuleArtifact(
    "./src/modules/billing",
    cwd,
    "billing",
  );
  for (const name of PROVIDERS) expect(resolved[name]).toBe(join(root, name));
});

test("keeps valid application providers ahead of module fallbacks", () => {
  const cwd = temp();
  const root = moduleRoot(cwd);
  for (const name of PROVIDERS) {
    write(cwd, `src/${name}/billing/index.ts`, "export {};");
    write(root, `${name}/index.ts`, "export {};");
  }
  const resolved = resolveModuleArtifact(
    "./src/modules/billing",
    cwd,
    "billing",
  );
  for (const name of PROVIDERS)
    expect(resolved[name]).toBe(join(cwd, "src", name, "billing"));
});

test("accepts direct files as bare-source providers", () => {
  const cwd = temp();
  const root = moduleRoot(cwd);
  for (const name of PROVIDERS) write(root, name, "export {};");
  const resolved = resolveModuleArtifact(
    "./src/modules/billing",
    cwd,
    "billing",
  );
  for (const name of PROVIDERS) expect(resolved[name]).toBe(join(root, name));
});
