import { expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadSystemMigrations } from "../cli/utils/load";
import { pipelineSystemMigrations } from "./systemMigrationExpectations";

test("pipelines select durability and jobs before pipeline storage", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pipeline-catalog-"));
  try {
    fs.writeFileSync(
      path.join(root, "damat.config.ts"),
      "export default { services: { pipelines: {} } }",
    );
    const migrations = await loadSystemMigrations("damat.config.ts", root);
    expect(migrations.map(({ owner, id }) => `${owner}:${id}`)).toEqual(
      pipelineSystemMigrations,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
