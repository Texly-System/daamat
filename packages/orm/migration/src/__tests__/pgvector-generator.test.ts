import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createInitialMigration } from "../generator/initialMigration";

describe("migration generation with pgvector", () => {
  it("emits the extension before HALFVEC and its HNSW index", async () => {
    const moduleDir = fs.mkdtempSync(path.join(os.tmpdir(), "orm-vector-migration-"));
    const table = {
      name: "asset",
      columns: [
        { name: "id", type: "uuid", primaryKey: true, nullable: false },
        { name: "embedding", type: "halfvec", dimensions: 2048, nullable: false, array: false },
      ],
      indexes: [{ name: "asset_embedding_hnsw", columns: [{ name: "embedding", operatorClass: "halfvec_cosine_ops" }], type: "hnsw" }],
    };
    fs.writeFileSync(path.join(moduleDir, "index.ts"), `export const models = { Asset: { toTableSchema: () => (${JSON.stringify(table)}) } };\n`);
    try {
      const migrationPath = await createInitialMigration("assets", moduleDir);
      const sql = fs.readFileSync(migrationPath, "utf8");
      expect(sql.indexOf("CREATE EXTENSION IF NOT EXISTS vector")).toBeLessThan(sql.indexOf("CREATE TABLE"));
      expect(sql).toContain("CREATE EXTENSION IF NOT EXISTS vector;");
      expect(sql).toContain('"embedding" HALFVEC(2048) NOT NULL');
      expect(sql).toContain("USING HNSW (\"embedding\" halfvec_cosine_ops)");
      const snapshot = JSON.parse(fs.readFileSync(path.join(moduleDir, "migrations", "schema-snapshot.json"), "utf8"));
      expect(snapshot.extensions).toEqual(["vector"]);
      const { createDiffMigration } = await import("../generator/diffMigration");
      expect((await createDiffMigration("assets", moduleDir)).hasChanges).toBe(false);
    } finally {
      fs.rmSync(moduleDir, { recursive: true, force: true });
    }
  });

  it("warns on a vector transition and advances the diff snapshot", async () => {
    const make = (dimensions: number) => ({ name: "asset", columns: [{ name: "embedding", type: "vector", dimensions, nullable: false, array: false }] });
    const baseline = fs.mkdtempSync(path.join(os.tmpdir(), "orm-vector-baseline-"));
    const next = fs.mkdtempSync(path.join(os.tmpdir(), "orm-vector-next-"));
    const write = (dir: string, table: unknown) => fs.writeFileSync(path.join(dir, "index.ts"), `export const models = { Asset: { toTableSchema: () => (${JSON.stringify(table)}) } };\n`);
    write(baseline, make(1536)); write(next, make(2048));
    try {
      await createInitialMigration("assets", baseline);
      fs.mkdirSync(path.join(next, "migrations"));
      fs.copyFileSync(path.join(baseline, "migrations", "schema-snapshot.json"), path.join(next, "migrations", "schema-snapshot.json"));
      const { createDiffMigration } = await import("../generator/diffMigration");
      const result = await createDiffMigration("assets", next);
      expect(result.warnings[0]).toContain("asset.embedding");
      expect(fs.readFileSync(result.filePath!, "utf8")).toContain("MANUAL REVIEW");
      expect(JSON.parse(fs.readFileSync(path.join(next, "migrations", "schema-snapshot.json"))).tables[0].columns[0].dimensions).toBe(2048);
    } finally {
      fs.rmSync(baseline, { recursive: true, force: true }); fs.rmSync(next, { recursive: true, force: true });
    }
  });
});
