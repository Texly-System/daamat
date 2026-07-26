import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  hashTree,
  type InstallerLock,
  type ResolvedArtifact,
} from "../../index";

export function fixture(): ResolvedArtifact {
  const rootDir = mkdtempSync(join(tmpdir(), "installer-plan-"));
  writeFileSync(join(rootDir, "index.ts"), "export {};");
  const request = {
    type: "npm" as const,
    name: "@example/blade",
    version: "1.0.0",
  };
  const immutableIdentity = "npm:@example/blade@1.0.0";
  return {
    request,
    rootDir,
    cleanup() {},
    metadata: {},
    integrity: hashTree(rootDir),
    immutableIdentity,
    provenance: { request, immutableIdentity, resolvedAt: "now", metadata: {} },
    supportedModes: ["source", "package"],
    packageReference: "@example/blade@1.0.0",
  };
}

export const lock: InstallerLock = { schemaVersion: 1, installations: {} };
