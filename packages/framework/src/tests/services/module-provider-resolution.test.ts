import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { resolveModuleArtifact } from "@damatjs/installer";
import { loadModuleProviders } from "../../services/moduleProviders";

const PROVIDERS = ["workflows", "jobs", "events", "pipelines"] as const;
let root = "";
const write = (path: string, value: string) => {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, value);
};
afterEach(() => rmSync(root, { recursive: true, force: true }));

test("loads direct files for every provider kind", async () => {
  root = mkdtempSync(join(tmpdir(), "damat-provider-files-"));
  const resolved: any = {
    root,
    manifest: { name: "billing" },
    entry: join(root, "index.ts"),
    location: root,
    mutable: false,
  };
  for (const name of PROVIDERS) {
    const file = join(root, `${name}.ts`);
    writeFileSync(
      file,
      `globalThis.__damatProviders ??= []; globalThis.__damatProviders.push("${name}");`,
    );
    resolved[name] = file;
  }
  await loadModuleProviders(new Map([["billing", resolved]]));
  expect((globalThis as any).__damatProviders).toEqual([...PROVIDERS]);
  delete (globalThis as any).__damatProviders;
});

test("fails invalid explicit provider directories without fallback", async () => {
  root = mkdtempSync(join(tmpdir(), "damat-provider-manifest-"));
  write("index.ts", "export default {};");
  write(
    "damat.json",
    JSON.stringify({
      schemaVersion: 1,
      kind: "module",
      name: "billing",
      module: { jobs: "./jobs" },
    }),
  );
  mkdirSync(join(root, "jobs"));
  const resolved = resolveModuleArtifact(root, root, "billing");
  expect(resolved.jobs).toBe(join(root, "jobs"));
  await expect(
    loadModuleProviders(new Map([["billing", resolved]])),
  ).rejects.toThrow(/Failed to load jobs provider.*no index/i);
});
