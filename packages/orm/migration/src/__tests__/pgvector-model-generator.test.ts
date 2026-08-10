import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createDiffMigration } from "../generator/diffMigration";
import { createInitialMigration } from "../generator/initialMigration";

const modelImport = pathToFileURL(
  path.resolve(import.meta.dir, "../../../model/dist/index.js"),
).href;

function writeModel(directory: string, vector: boolean): void {
  const embedding = vector ? ", embedding: columns.vector(2048)" : "";
  fs.writeFileSync(
    path.join(directory, "index.ts"),
    `import { columns, model } from ${JSON.stringify(modelImport)};
export const models = { Entry: model("section_search_entries", {
  id: columns.text().primaryKey()${embedding}
}).timestamps(false).softDelete(false) };
`,
  );
}

function assertNativeVector(sql: string): void {
  const extension = sql.indexOf("CREATE EXTENSION IF NOT EXISTS vector");
  const vector = sql.indexOf('"embedding" VECTOR(2048)');
  expect(extension).toBeGreaterThanOrEqual(0);
  expect(vector).toBeGreaterThan(extension);
  expect(sql).not.toContain('"embedding" REAL[]');
}

describe("columns.vector migration generation", () => {
  it("emits native VECTOR(2048) from the public model builder", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "vector-model-"));
    try {
      writeModel(directory, true);
      const file = await createInitialMigration("search", directory);
      assertNativeVector(fs.readFileSync(file, "utf8"));
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("installs vector before incrementally adding the first column", async () => {
    const baseline = fs.mkdtempSync(path.join(os.tmpdir(), "vector-base-"));
    const next = fs.mkdtempSync(path.join(os.tmpdir(), "vector-next-"));
    try {
      writeModel(baseline, false);
      await createInitialMigration("search", baseline);
      writeModel(next, true);
      fs.mkdirSync(path.join(next, "migrations"));
      fs.copyFileSync(
        path.join(baseline, "migrations", "schema-snapshot.json"),
        path.join(next, "migrations", "schema-snapshot.json"),
      );
      const result = await createDiffMigration("search", next);
      assertNativeVector(fs.readFileSync(result.filePath!, "utf8"));
    } finally {
      fs.rmSync(baseline, { recursive: true, force: true });
      fs.rmSync(next, { recursive: true, force: true });
    }
  });
});
